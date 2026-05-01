import torch
import numpy as np
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from django.conf import settings
import io

# Charger le modèle CLIP une seule fois au démarrage
print("Chargement du modèle CLIP...")
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
model.eval()
print(" Modèle CLIP chargé !")


def get_image_vector(image_file):
    """
    Prend une image (fichier uploadé ou chemin)
    et retourne un vecteur numpy de 512 dimensions
    """
    try:
        if hasattr(image_file, 'read'):
            image = Image.open(image_file).convert("RGB")
        else:
            image = Image.open(image_file).convert("RGB")

        inputs = processor(images=image, return_tensors="pt")

        with torch.no_grad():
             outputs = model.vision_model(**inputs)
             features = outputs.pooler_output

        vector = features.detach().cpu().numpy()[0]
        vector = vector / np.linalg.norm(vector)

        return vector.tolist()

    except Exception as e:
        print(f"Erreur get_image_vector: {e}")
        return None


def cosine_similarity(vec1, vec2):
    """
    Calcule la similarité cosinus entre 2 vecteurs
    Retourne un score entre 0 et 1 (1 = identique)
    """
    v1 = np.array(vec1)
    v2 = np.array(vec2)
    dot = np.dot(v1, v2)
    norm = np.linalg.norm(v1) * np.linalg.norm(v2)
    if norm == 0:
        return 0
    return float(dot / norm)


def find_similar_patterns(query_vector, top_k=10):
    """
    Compare le vecteur de la requête avec tous les embeddings
    existants et retourne les top_k patrons les plus similaires
    """
    from .models import PatternEmbedding

    embeddings = PatternEmbedding.objects.select_related('pattern').exclude(
        vector=[]
    )

    results = []
    for emb in embeddings:
        if not emb.vector:
            continue
        score = cosine_similarity(query_vector, emb.vector)
        results.append({
            'pattern': emb.pattern,
            'score': score
        })

    # Trier par score décroissant
    results.sort(key=lambda x: x['score'], reverse=True)

    return results[:top_k]


def generate_pattern_embedding(pattern):
    """
    Génère et sauvegarde l'embedding d'un patron
    depuis son image de couverture
    """
    from .models import PatternEmbedding

    if not pattern.cover_image:
        return None

    try:
        vector = get_image_vector(pattern.cover_image.path)
        if vector:
            emb, _ = PatternEmbedding.objects.get_or_create(pattern=pattern)
            emb.vector = vector
            emb.save()
            return emb
    except Exception as e:
        print(f"Erreur generate_pattern_embedding: {e}")
        return None