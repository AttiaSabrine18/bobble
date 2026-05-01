from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

def generate_invoice(user, pattern, file_path):
    doc = SimpleDocTemplate(file_path)
    styles = getSampleStyleSheet()

    elements = []

    elements.append(Paragraph("FACTURE", styles["Title"]))
    elements.append(Spacer(1, 10))

    elements.append(Paragraph(f"Client: {user.username}", styles["Normal"]))
    elements.append(Paragraph(f"Email: {user.email}", styles["Normal"]))
    elements.append(Spacer(1, 10))

    elements.append(Paragraph(f"Produit: {pattern.title}", styles["Normal"]))
    elements.append(Paragraph(f"Prix: {pattern.price} €", styles["Normal"]))

    doc.build(elements)