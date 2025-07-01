'use client';

import React, { useState, useRef, useEffect } from "react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CARD_WIDTH = 1012; // px (3.375in at 300dpi)
const CARD_HEIGHT = 638; // px (2.125in at 300dpi)

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  // Handle YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  }
  // Handle ISO string
  const isoMatch = dateString.match(/^\d{4}-\d{2}-\d{2}/);
  if (isoMatch) {
    const [year, month, day] = isoMatch[0].split("-");
    return `${day}-${month}-${year}`;
  }
  // Handle DD-MM-YYYY HH:mm:ss.SSS
  const customMatch = dateString.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (customMatch) {
    const [, day, month, year] = customMatch;
    return `${day}-${month}-${year}`;
  }
  return "N/A";
};

interface FamilyMember {
  name: string;
  relation: string;
  dob: string;
  bloodGroup: string;
  photoUrl?: string;
}

export interface RailwayIdCardProps {
  name: string;
  designation: string;
  pfNumber: string;
  ruidNo?: string;
  station: string;
  dateOfBirth: string;
  bloodGroup: string;
  contactNumber: string;
  address: string;
  familyMembers: FamilyMember[];
  photoUrl: string;
  signatureUrl: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalInfo: string;
  qrUrl?: string;
}

export function RailwayIdCardDynamic(props: RailwayIdCardProps) {
  const [showBack, setShowBack] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const PREVIEW_WIDTH = 350;
  const PREVIEW_SCALE = PREVIEW_WIDTH / CARD_WIDTH;

  const isSmallScreen = typeof window !== 'undefined' && (window.innerWidth < 400 || window.innerHeight < 600);

  // Generate HTML for card sides
  const generateCardHTML = (isBackSide: boolean) => {
    const formattedName = props.name?.split(' ').slice(0, 3).join(' ').toUpperCase() || "N/A";
    
    if (isBackSide) {
      // BACK SIDE (QR bottom right, lost card message to the left, allow wrapping)
      const familyDetailsText = props.familyMembers && props.familyMembers.length > 0
        ? props.familyMembers.map(fm =>
            [fm.name || "N/A", fm.relation || "N/A", formatDate(fm.dob || ""), fm.bloodGroup || "N/A"].join("&nbsp;|&nbsp;")
          ).join("<br style=\"line-height:2; margin-bottom:8px;\"/>")
        : "No family member details available";
      return `
        <div style="position: relative; width: 1012px; height: 638px; background: #fff; font-family: Arial, Helvetica, sans-serif; overflow: hidden; box-sizing: border-box;">
          <div style="position: absolute; top: 20px; left: 48px; right: 48px; text-align: center; font-size: 26px; font-weight: bold; color: #000; letter-spacing: 0.5px;">
            परिवार का विवरण/Details of the family
          </div>
          <div style="position: absolute; top: 75px; left: 48px; font-size: 19px; font-weight: 400; color: #000; line-height: 1.7; max-width: 700px; white-space: normal; word-break: break-word; display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px;">
            ${familyDetailsText}
            <div style="margin-top: 12px; font-weight: bold;">Emergency Contact No. : ${props.emergencyPhone || "N/A"}</div>
            <div style="margin-top: 8px;">घर का पता/Res.Address: ${props.address}</div>
          </div>
          <div style="position: absolute; right: 48px; bottom: 35px; width: 160px; height: 160px; background: #fff; display: flex; align-items: center; justify-content: center;">
            ${props.qrUrl ? `<img src=\"${props.qrUrl}\" alt=\"QR Code\" style=\"width: 160px; height: 160px; object-fit: contain; background: #fff;\" />` : ''}
          </div>
          <div style="position: absolute; bottom: 35px; left: 48px; right: 238px; font-size: 15px; fontWeight: 400; color: #666; line-height: 1.3; text-align: left; max-width: 650px;">
            <div>यदि यह कार्ड मिले तो कृपया निकटतम पोस्ट बॉक्स में डाल दें।</div>
            <div>If found please drop it in the nearest Post Box</div>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="position: relative; width: 1012px; height: 638px; background: #ffffff; font-family: Arial, Helvetica, sans-serif; overflow: hidden; box-sizing: border-box;">
          <!-- Railway Logo -->
          <div style="position: absolute; top: 25px; left: 25px; width: 100px; height: 100px; background: #f9f9f9; display: flex; align-items: center; justify-content: center;">
            <img src="/ecor.png" alt="Railway Logo" style="width: 90px; height: 90px; object-fit: contain;" />
          </div>

          <!-- Header Text -->
          <div style="position: absolute; top: 10px; left: 0; width: 100%; text-align: center;">
            <div style="font-size: 44px; font-weight: 900; color: #000; line-height: 1.1; margin-bottom: 12px; letter-spacing: 1px;">पूर्व तट रेलवे</div>
            <div style="font-size: 36px; font-weight: 900; color: #000; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 24px;">East Coast Railway</div>
          </div>

          <!-- Department Bars (thicker, flexbox, centered) -->
          <div style="position: absolute; top: 150px; left:0; width: 100%; height: 48px; display: flex;">
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #00A5B4; font-size: 18px; font-weight: bold; color: #fff;">विभाग</div>
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #00A5B4; font-size: 18px; font-weight: bold; color: #fff;">DEPARTMENT</div>
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #00A5B4; font-size: 18px; font-weight: bold; color: #fff;">व्यावसायिक</div>
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #00A5B4; font-size: 18px; font-weight: bold; color: #fff;">COMMERCIAL</div>
          </div>

          <div style="position: absolute; top: 198px; left:0; width: 100%; height: 48px; display: flex;">
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #004B85; font-size: 18px; font-weight: bold; color: #fff;">पहचान पत्र</div>
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #004B85; font-size: 18px; font-weight: bold; color: #fff;">IDENTITY CARD</div>
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #004B85; font-size: 18px; font-weight: bold; color: #fff;">प्र.का</div>
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #004B85; font-size: 18px; font-weight: bold; color: #fff;">H.Q. SI.No. COMMERCIAL-</div>
          </div>

          <!-- Photo -->
          <div style="position: absolute; top: 255px; left: 25px; width: 120px; height: 150px; background: #e6f7ff; display: flex; align-items: center; justify-content: center; overflow: hidden;">
            ${props.photoUrl ? `<img src="${props.photoUrl}" alt="Photo of ${props.name}" style="width: 100%; height: 100%; object-fit: cover; object-position: center;" />` : '<div style="font-size: 18px; color: #888; text-align: center;">PHOTO</div>'}
          </div>

          <!-- Employee Details -->
          <div style="position: absolute; top: 255px; left: 170px; right: 25px; font-size: 22px; color: #000; line-height: 1.5;">
            <div style="display: flex; margin-bottom: 8px; align-items: center;">
              <span style="width: 100px; font-weight: bold; font-size: 18px;">नाम</span>
              <span style="width: 100px; font-weight: bold; font-size: 18px;">Name</span>
              <span style="font-weight: bold; max-width: 500px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; line-height: 37px; height: 37px">: ${props.name ? props.name.split(' ').slice(0, 3).join(' ').toUpperCase() : 'N/A'}</span>
            </div>
            
            <div style="display: flex; margin-bottom: 8px; align-items: center;">
              <span style="width: 100px; font-weight: bold; font-size: 18px;">पद नाम</span>
              <span style="width: 100px; font-weight: bold; font-size: 18px;">Desig</span>
              <span style="font-weight: bold;">: ${props.designation || "N/A"}</span>
            </div>
            
            <div style="display: flex; margin-bottom: 8px; align-items: center;">
              <span style="width: 100px; font-weight: bold; font-size: 18px;">पी.एफ.नं</span>
              <span style="width: 100px; font-weight: bold; font-size: 18px;">P.F.No.</span>
              <span style="font-weight: bold;">: ${props.ruidNo || props.pfNumber || "N/A"}</span>
            </div>
            
            <div style="display: flex; margin-bottom: 8px; align-items: center;">
              <span style="width: 100px; font-weight: bold; font-size: 18px;">स्टेशन</span>
              <span style="width: 100px; font-weight: bold; font-size: 18px;">Station</span>
              <span style="font-weight: bold;">: ${props.station || "N/A"}</span>
            </div>
            
            <div style="display: flex; align-items: center;">
              <span style="width: 100px; font-weight: bold; font-size: 18px;">जन्म तारीख</span>
              <span style="width: 100px; font-weight: bold; font-size: 18px;">D.O.B</span>
              <span style="font-weight: bold;">: ${formatDate(props.dateOfBirth)}</span>
            </div>
          </div>

          <!-- Signatures -->
          <div style="position: absolute; left: 25px; bottom: 25px; width: 240px; text-align: center;">
            <div style="height: 40px; width: 140px; margin: 0 auto 8px auto; background: #fff; display: flex; align-items: center; justify-content: center;">
              ${props.signatureUrl ? `<img src="${props.signatureUrl}" alt="Card Holder Signature" style="width: 130px; height: 35px; object-fit: contain;" />` : '<span style="font-size: 12px; color: #ccc;">SIGNATURE</span>'}
            </div>
            <div style="font-size: 14px; font-weight: bold; color: #000; line-height: 1.2;">
              <div>कार्डधारी का हस्ताक्षर</div>
              <div>Signature of Card Holder</div>
            </div>
          </div>

          <div style="position: absolute; right: 25px; bottom: 25px; width: 240px; text-align: center;">
            <div style="height: 40px; width: 140px; margin: 0 auto 8px auto; background: #fff; display: flex; align-items: center; justify-content: center;">
              <img src="/authority sign.jpg" alt="Authority Signature" style="width: 130px; height: 35px; object-fit: contain;" />
            </div>
            <div style="font-size: 14px; font-weight: bold; color: #000; line-height: 1.2;">
              <div>जारीकर्ता प्राधिकारी का हस्ताक्षर</div>
              <div>Signature of Issuing Authority</div>
            </div>
          </div>
        </div>
      `;
    }
  };

  // Export to PDF with exact PVC card dimensions
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Create temporary container for front side
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = `${CARD_WIDTH}px`;
      tempContainer.style.height = `${CARD_HEIGHT}px`;
      document.body.appendChild(tempContainer);

      // Render front side
      const frontCard = document.createElement('div');
      frontCard.innerHTML = generateCardHTML(false);
      tempContainer.appendChild(frontCard);

      // Capture front side
      const frontCanvas = await html2canvas(frontCard, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        logging: false,
      });

      // Clear container and render back side
      tempContainer.innerHTML = '';
      const backCard = document.createElement('div');
      backCard.innerHTML = generateCardHTML(true);
      tempContainer.appendChild(backCard);

      // Capture back side
      const backCanvas = await html2canvas(backCard, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        logging: false,
      });

      // Clean up
      document.body.removeChild(tempContainer);

      // Create PDF with exact PVC card dimensions
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'in',
        format: [3.375, 2.125],
      });

      // Add front side
      pdf.addImage(frontCanvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, 3.375, 2.125);

      // Add back side on new page
      pdf.addPage([3.375, 2.125], 'landscape');
      pdf.addImage(backCanvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, 3.375, 2.125);

      // Save PDF
      pdf.save(`railway-id-card-${props.name?.replace(/\s+/g, '-') || 'unknown'}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Safe family member data
  const fam = props.familyMembers && props.familyMembers.length > 0 ? props.familyMembers[0] : null;
  const familyLine = fam
    ? `${fam.name || "N/A"} (${fam.relation || "N/A"}, ${formatDate(fam.dob || "")}, ${fam.bloodGroup || "N/A"})`
    : "No family member details available";

  // --- CARD COMPONENT ---
  const CardComponent = ({ isForPrint = false, showBackSide = false }: { isForPrint?: boolean; showBackSide?: boolean }) => {
    const cardStyle: React.CSSProperties = {
      position: "relative",
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      background: "#ffffff",
      fontFamily: "Arial, Helvetica, sans-serif",
      overflow: "hidden",
      boxSizing: "border-box",
    };

    if (showBackSide) {
      // BACK SIDE (QR bottom right, lost card message to the left, allow wrapping)
      return (
        <div style={cardStyle}>
          {/* Header */}
          <div style={{
            position: "absolute",
            top: 20,
            left: 48,
            right: 48,
            textAlign: "center",
            fontSize: 26,
            fontWeight: "bold",
            color: "#000",
            letterSpacing: "0.5px"
          }}>
            परिवार का विवरण/Details of the family
          </div>

          {/* Family Details (column for each member) */}
          <div style={{
            position: "absolute",
            top: 75,
            left: 48,
            fontSize: 19,
            fontWeight: 400,
            color: "#000",
            lineHeight: 1.7,
            maxWidth: 700,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '12px'
          }}>
            {props.familyMembers && props.familyMembers.length > 0 ? (
              <>
                {props.familyMembers.map((fm, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '24px', marginBottom: '4px' }}>
                    <span>{fm.name || "N/A"}</span>
                    <span>{fm.relation || "N/A"}</span>
                    <span>{formatDate(fm.dob || "")}</span>
                    <span>{fm.bloodGroup || "N/A"}</span>
                  </div>
                ))}
                <div style={{ marginTop: '12px', fontWeight: 'bold' }}>
                  Emergency Contact No. : {props.emergencyPhone || "N/A"}
                </div>
                <div style={{ marginTop: '8px' }}>
                  घर का पता/Res.Address: {props.address}
                </div>
              </>
            ) : "No family member details available"}
          </div>

          {/* QR Code */}
          <div style={{
            position: "absolute",
            right: 48,
            bottom: 35,
            width: 160,
            height: 160,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {props.qrUrl ? (
              <img
                src={props.qrUrl}
                alt="QR Code"
                style={{
                  width: "160px",
                  height: "160px",
                  objectFit: "contain",
                  background: "#fff"
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.nextElementSibling) {
                    (target.nextElementSibling as HTMLElement).style.display = 'block';
                  }
                }}
              />
            ) : null}
          </div>

          {/* Lost Card Message */}
          <div style={{
            position: "absolute",
            bottom: 35,
            left: 48,
            right: 238,
            fontSize: 15,
            fontWeight: 400,
            color: "#666",
            lineHeight: 1.3,
            textAlign: "left",
            maxWidth: 650
          }}>
            <div>यदि यह कार्ड मिले तो कृपया निकटतम पोस्ट बॉक्स में डाल दें।</div>
            <div>If found please drop it in the nearest Post Box</div>
          </div>
        </div>
      );
    } else {
      // FRONT SIDE
      return (
        <div style={cardStyle}>
          {/* Railway Logo */}
          <div style={{
            position: "absolute",
            top: 25,
            left: 25,
            width: 100,
            height: 100,
            background: "#f9f9f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <img
              src="/ecor.png"
              alt="Railway Logo"
              style={{
                width: "90px",
                height: "90px",
                objectFit: "contain"
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.nextElementSibling) {
                  (target.nextElementSibling as HTMLElement).style.display = 'block';
                }
              }}
            />
            <div style={{
              fontSize: 14,
              color: "#666",
              display: "none",
              textAlign: "center"
            }}>
              LOGO
            </div>
          </div>

          {/* Header Text */}
          <div style={{
            position: "absolute",
            top: 10,
            left: 0,
            width: "100%",
            textAlign: "center"
          }}>
            <div style={{
              fontSize: 44,
              fontWeight: 900,
              color: "#000",
              lineHeight: 1.1,
              marginBottom: 12,
              letterSpacing: 1
            }}>
              पूर्व तट रेलवे
            </div>
            <div style={{
              fontSize: 36,
              fontWeight: 900,
              color: "#000",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 24
            }}>
              East Coast Railway
            </div>
          </div>

          {/* Department Bars (thicker, flexbox, centered) */}
          <div style={{
            position: "absolute",
            top: 150,
            left: 0,
            width: "100%",
            height: 48,
            display: "flex"
          }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#00A5B4", fontSize: 22, fontWeight: "bold", color: "#fff" }}>विभाग</div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#00A5B4", fontSize: 22, fontWeight: "bold", color: "#fff" }}>DEPARTMENT</div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#00A5B4", fontSize: 22, fontWeight: "bold", color: "#fff" }}>व्यावसायिक</div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#00A5B4", fontSize: 22, fontWeight: "bold", color: "#fff" }}>COMMERCIAL</div>
          </div>

          <div style={{
            position: "absolute",
            top: 198,
            left: 0,
            width: "100%",
            height: 48,
            display: "flex"
          }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#004B85", fontSize: 22, fontWeight: "bold", color: "#fff" }}>पहचान पत्र</div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#004B85", fontSize: 22, fontWeight: "bold", color: "#fff" }}>IDENTITY CARD</div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#004B85", fontSize: 22, fontWeight: "bold", color: "#fff" }}>प्र.का</div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#004B85", fontSize: 18, fontWeight: "bold", color: "#fff" }}>H.Q. SI.No. COMMERCIAL-</div>
          </div>

          {/* Photo */}
          <div style={{
            position: "absolute",
            top: 255,
            left: 25,
            width: 120,
            height: 150,
            background: "#e6f7ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden"
          }}>
            {props.photoUrl ? (
              <img
                src={props.photoUrl}
                alt={`Photo of ${props.name}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center"
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.nextElementSibling) {
                    (target.nextElementSibling as HTMLElement).style.display = 'block';
                  }
                }}
              />
            ) : null}
            <div style={{
              fontSize: 18,
              color: "#888",
              display: props.photoUrl ? "none" : "block",
              textAlign: "center"
            }}>
              PHOTO
            </div>
          </div>

          {/* Employee Details */}
          <div style={{
            position: "absolute",
            top: 255,
            left: 170,
            right: 25,
            fontSize: 22,
            color: "#000",
            lineHeight: 1.5
          }}>
            <div style={{ display: "flex", marginBottom: 8, alignItems: "center", minHeight: 35 }}>
              <span style={{ width: 100, fontWeight: "bold", fontSize: 18 }}>नाम</span>
              <span style={{ width: 100, fontWeight: "bold", fontSize: 18 }}>Name</span>
              <span style={{ fontWeight: "bold", maxWidth: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "inline-block", lineHeight: "35px", height: "35px" }}>
                : {props.name ? props.name.split(' ').slice(0, 3).join(' ').toUpperCase() : 'N/A'}
              </span>
            </div>
            
            <div style={{ display: "flex", marginBottom: 8, alignItems: "center" }}>
              <span style={{ width: 100, fontWeight: "bold", fontSize: 18 }}>पद नाम</span>
              <span style={{ width: 100, fontWeight: "bold", fontSize: 18 }}>Desig</span>
              <span style={{ fontWeight: "bold" }}>: {props.designation || "N/A"}</span>
            </div>
            
            <div style={{ display: "flex", marginBottom: 8, alignItems: "center" }}>
              <span style={{ width: 100, fontWeight: "bold", fontSize: 18 }}>पी.एफ.नं</span>
              <span style={{ width: 100, fontWeight: "bold", fontSize: 18 }}>P.F.No.</span>
              <span style={{ fontWeight: "bold" }}>: {props.ruidNo || props.pfNumber || "N/A"}</span>
            </div>
            
            <div style={{ display: "flex", marginBottom: 8, alignItems: "center" }}>
              <span style={{ width: 100, fontWeight: "bold", fontSize: 18 }}>स्टेशन</span>
              <span style={{ width: 100, fontWeight: "bold", fontSize: 18 }}>Station</span>
              <span style={{ fontWeight: "bold" }}>: {props.station || "N/A"}</span>
            </div>
            
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ width: 100, fontWeight: "bold", fontSize: 18 }}>जन्म तारीख</span>
              <span style={{ width: 100, fontWeight: "bold", fontSize: 18 }}>D.O.B</span>
              <span style={{ fontWeight: "bold" }}>: {formatDate(props.dateOfBirth)}</span>
            </div>
          </div>

          {/* Signatures */}
          <div style={{
            position: "absolute",
            left: 25,
            bottom: 25,
            width: 240,
            textAlign: "center"
          }}>
            <div style={{
              height: 40,
              width: 140,
              margin: "0 auto 8px auto",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {props.signatureUrl ? (
                <img
                  src={props.signatureUrl}
                  alt="Card Holder Signature"
                  style={{
                    width: "130px",
                    height: "35px",
                    objectFit: "contain"
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <span style={{ fontSize: 12, color: "#ccc" }}>SIGNATURE</span>
              )}
            </div>
            <div style={{ fontSize: 14, fontWeight: "bold", color: "#000", lineHeight: 1.2 }}>
              <div>कार्डधारी का हस्ताक्षर</div>
              <div>Signature of Card Holder</div>
            </div>
          </div>

          <div style={{
            position: "absolute",
            right: 25,
            bottom: 25,
            width: 240,
            textAlign: "center"
          }}>
            <div style={{
              height: 40,
              width: 140,
              margin: "0 auto 8px auto",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <img
                src="/authority sign.jpg"
                alt="Authority Signature"
                style={{
                  width: "130px",
                  height: "35px",
                  objectFit: "contain"
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.nextElementSibling) {
                    (target.nextElementSibling as HTMLElement).style.display = 'block';
                  }
                }}
              />
              <span style={{ fontSize: 12, color: "#ccc", display: "none" }}>AUTH SIGN</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: "bold", color: "#000", lineHeight: 1.2 }}>
              <div>जारीकर्ता प्राधिकारी का हस्ताक्षर</div>
              <div>Signature of Issuing Authority</div>
            </div>
          </div>
        </div>
      );
    }
  };

  // --- PREVIEW CARD (fixed width, compact, centered) ---
  const PreviewCard = () => (
    <div
      style={{
        width: PREVIEW_WIDTH,
        height: PREVIEW_WIDTH * CARD_HEIGHT / CARD_WIDTH,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        borderRadius: '0.5rem',
        boxShadow: '0 2px 8image.pngpx rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
        margin: '0 auto',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          transform: `scale(${PREVIEW_SCALE})`,
          transformOrigin: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CardComponent showBackSide={false} />
      </div>
    </div>
  );

  // --- OPEN IN NEW WINDOW BUTTON ---
  const openInNewWindow = () => {
    const win = window.open('', '_blank', 'width=500,height=400');
    if (win) {
      win.document.write('<!DOCTYPE html><html><head><title>ID Card Preview</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#f8fafc;">');
      win.document.write('<div style="width:350px;height:221px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.10);border:1.5px solid #bbb;display:flex;align-items:center;justify-content:center;">');
      win.document.write('<div id="card-root"></div>');
      win.document.write('</div></body></html>');
      win.document.close();
      setTimeout(() => {
        const mount = win.document.getElementById('card-root');
        if (mount) {
          // @ts-ignore
          import('react-dom').then(ReactDOM => {
            ReactDOM.render(<CardComponent />, mount);
          });
        }
      }, 100);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        padding: '1.5rem',
        gap: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: PREVIEW_WIDTH + 40,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        {/* Card Preview */}
        <div
          style={{
            width: PREVIEW_WIDTH,
            height: PREVIEW_WIDTH * CARD_HEIGHT / CARD_WIDTH,
            position: 'relative',
            perspective: '1000px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s',
              transform: showBack ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front Side */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: '#fff',
                borderRadius: '0.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  transform: `scale(${PREVIEW_SCALE})`,
                  transformOrigin: 'center',
                }}
              >
                <CardComponent showBackSide={false} />
              </div>
            </div>
            {/* Back Side */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: '#fff',
                borderRadius: '0.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                transform: 'rotateY(180deg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  transform: `scale(${PREVIEW_SCALE})`,
                  transformOrigin: 'center',
                }}
              >
                <CardComponent showBackSide={true} />
              </div>
            </div>
          </div>
        </div>

        {/* Card Actions */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            width: '100%',
            padding: '0.5rem',
          }}
          className="no-print"
        >
          <button
            onClick={() => setShowBack(!showBack)}
            style={{
              padding: '0.625rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              border: 'none',
              borderRadius: '0.375rem',
              background: '#7c3aed',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              minWidth: '120px',
              justifyContent: 'center',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Flip Card
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            style={{
              padding: '0.625rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              border: 'none',
              borderRadius: '0.375rem',
              background: '#7c3aed',
              color: '#fff',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: isExporting ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              minWidth: '120px',
              justifyContent: 'center',
            }}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          @page {
            size: 3.375in 2.125in landscape;
            margin: 0;
            padding: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 3.375in !important;
            height: 2.125in !important;
            background: white !important;
          }
          .print-card {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 3.375in !important;
            height: 2.125in !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .preview-card, .no-print { 
            display: none !important; 
          }
          .page-break {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}