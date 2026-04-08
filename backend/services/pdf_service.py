
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from io import BytesIO
import pypdf
from datetime import datetime

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract text content from a PDF file (bytes).
    """
    try:
        reader = pypdf.PdfReader(BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""

def generate_interview_pdf(report_data: dict) -> BytesIO:
    """
    Generate a PDF report for the interview.
    Returns a BytesIO object containing the PDF data.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = styles["Title"]
    story.append(Paragraph("Interview Report", title_style))
    story.append(Spacer(1, 12))

    # Metadata
    normal_style = styles["Normal"]
    bold_style = ParagraphStyle(name="Bold", parent=styles["Normal"], fontName="Helvetica-Bold")
    
    # Extract data safely with defaults
    # Support both InterviewReport keys and DB keys
    role = report_data.get("job_role") or report_data.get("role_title", "N/A")
    
    date_val = report_data.get("interview_date") or report_data.get("created_at")
    if isinstance(date_val, str):
        date_str = date_val[:10]
    elif hasattr(date_val, "strftime"):
        date_str = date_val.strftime("%Y-%m-%d")
    else:
        date_str = datetime.now().strftime("%Y-%m-%d")
        
    score = report_data.get("overall_semantic_score") or report_data.get("performance_score", 0)
    
    # feedback_json might be nested (DB row) or the object itself (InterviewReport)
    feedback = report_data.get("feedback_json", {})
    if not feedback: 
        # If no explicit feedback_json, the whole object is likely the report
        feedback = report_data 
        
    # Start Metadata Section
    metadata = [
        ["Job Role:", role],
        ["Date:", date_str],
        ["Performance Score:", f"{score:.1f}/10"],
    ]
    
    encoded_metadata = []
    for row in metadata:
        encoded_metadata.append([Paragraph(f"<b>{row[0]}</b>", normal_style), Paragraph(str(row[1]), normal_style)])

    t = Table(encoded_metadata, colWidths=[120, 400])
    t.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.darkblue),
    ]))
    story.append(t)
    story.append(Spacer(1, 24))

    # Q&A Section
    story.append(Paragraph("Interview Questions & Analysis", styles["Heading2"]))
    story.append(Spacer(1, 12))
    
    questions = feedback.get("questions_answers", [])
    if not questions:
        # Try finding transcript if q&a structure is missing
        questions = [] 
        # Logic to parse transcript if needed, but for now assuming q&a exists in proper report
        story.append(Paragraph("Detailed Q&A data not available.", normal_style))
    
    for i, qa in enumerate(questions, 1):
        q_text = qa.get("question", "Question missing")
        a_text = qa.get("user_answer", "Answer missing")
        score = qa.get("semantic_score", 0)
        feedback_text = qa.get("feedback", "")
        
        # Question Header
        story.append(Paragraph(f"<b>Q{i}: {q_text}</b>", styles["Heading3"]))
        story.append(Spacer(1, 6))
        
        # Answer
        story.append(Paragraph(f"<b>Candidate Answer:</b> {a_text}", normal_style))
        story.append(Spacer(1, 6))
        
        # Feedback/Score
        evaluation = f"<b>Score:</b> {score}/10<br/><b>Feedback:</b> {feedback_text}"
        story.append(Paragraph(evaluation, normal_style))
        story.append(Spacer(1, 12))
        story.append(Paragraph("_" * 60, normal_style)) # Separator
        story.append(Spacer(1, 12))

    # AI Summary
    if "overall_feedback" in feedback:
        story.append(Paragraph("Overall Feedback", styles["Heading2"]))
        story.append(Paragraph(feedback["overall_feedback"], normal_style))
        story.append(Spacer(1, 12))

    doc.build(story)
    buffer.seek(0)
    return buffer