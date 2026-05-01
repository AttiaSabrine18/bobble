from django.core.management.base import BaseCommand
from api.models import Pattern
from api.ai_service import generate_pattern_embedding


class Command(BaseCommand):
    help = 'Génère les embeddings AI pour tous les patrons avec une image'

    def handle(self, *args, **kwargs):
        patterns = Pattern.objects.filter(cover_image__isnull=False).exclude(cover_image='')
        total = patterns.count()

        self.stdout.write(f" {total} patrons à indexer...")

        success = 0
        for i, pattern in enumerate(patterns, 1):
            result = generate_pattern_embedding(pattern)
            if result:
                success += 1
                self.stdout.write(f"   [{i}/{total}] {pattern.title}")
            else:
                self.stdout.write(f"   [{i}/{total}] {pattern.title} — pas d'image")

        self.stdout.write(f"\n Indexation terminée : {success}/{total} patrons indexés !")