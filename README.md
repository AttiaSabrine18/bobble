<div align="center">

# 🧶 Bobble

### Plateforme communautaire & marketplace pour le tricot, crochet et DIY

![Status](https://img.shields.io/badge/status-active-success?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)

[![Django](https://img.shields.io/badge/Django-6.0-092E20?style=for-the-badge\&logo=django\&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-TypeScript-61DAFB?style=for-the-badge\&logo=react\&logoColor=black)](https://react.dev/)
[![DRF](https://img.shields.io/badge/DRF-API-red?style=for-the-badge)](https://www.django-rest-framework.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Payment-635BFF?style=for-the-badge\&logo=stripe\&logoColor=white)](https://stripe.com/)
[![AI](https://img.shields.io/badge/AI-CLIP-orange?style=for-the-badge)](https://openai.com/research/clip)

---

💡 **Bobble est une plateforme full-stack inspirée de Ravelry**, combinant
**réseau social + marketplace + IA** pour les passionnés de tricot et crochet.

</div>

---

## 🧠 Vision du projet

Bobble vise à devenir une plateforme complète pour créateurs DIY :

* Centraliser les patrons
* Créer une vraie communauté
* Faciliter la monétisation des créateurs
* Utiliser l’IA pour améliorer la découverte

---

## ✨ Fonctionnalités principales

### 🧶 Catalogue intelligent

* Recherche avancée + filtres dynamiques
* ⭐ Système de notation & favoris
* 📄 Téléchargement sécurisé des PDF
* 🤖 **Recherche visuelle par IA (CLIP)**

### 🛒 Marketplace

* Vente de patrons et produits
* Paiement sécurisé via Stripe
* Gestion du stock & commandes
* Dashboard créateur (revenus, stats)

### 👥 Réseau social

* Profils utilisateurs
* Forums & discussions
* Messagerie privée

### 📁 Organisation personnelle

* Projets avec images
* Yarn stash & inventaire matériel

---

## 🏗️ Architecture

```text
Frontend (React + TS)
        ↓
   REST API
        ↓
Backend (Django)
        ↓
Database + AI + Stripe
```

### 🔥 Particularité

➡️ Architecture **Headless (découplée)**
➡️ Backend = API indépendante
➡️ Frontend = consommateur API

---

## 🤖 Intelligence Artificielle

Recherche visuelle basée sur :

* Modèle : `CLIP (OpenAI)`
* Embeddings : 512 dimensions
* Similarité : Cosinus

Pipeline :

```
Image → Embedding → Comparaison → Résultats pertinents
```

👉 Permet de trouver un patron à partir d’une photo

---

## 🔐 Sécurité

* Authentification **JWT (SimpleJWT)**
* Support **Passkey / WebAuthn (FIDO2)**
* Rotation automatique des tokens
---

## 💳 Paiement Stripe

* Checkout sécurisé
* Webhooks vérifiés
* Idempotence (anti double paiement)
* Génération automatique de facture PDF

---

## ⚙️ Installation

### 1. Clone

```bash
git clone https://github.com/AttiaSabrine18/bobble.git
cd bobble
```

---

### 2. Backend

```bash
cd backend_api
python -m venv venv
source venv/bin/activate   # ou venv\Scripts\activate (Windows)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

### 3. Frontend

```bash
cd frontend
npm install
npm run start
```

---

## 🌐 Environnement

Créer `.env` :

```env
SECRET_KEY=your_secret
DEBUG=True

STRIPE_SECRET_KEY=your_key
STRIPE_WEBHOOK_SECRET=your_webhook
```

---

## 📡 API Endpoints (extrait)

| Méthode | Endpoint                | Description       |
| ------- | ----------------------- | ----------------- |
| POST    | `/api/token/`           | Login             |
| GET     | `/api/patterns/`        | Liste des patrons |
| POST    | `/api/purchase/create/` | Paiement          |
| POST    | `/api/search/visual/`   | Recherche IA      |

---

## 📁 Structure du projet

```text
bobble/
├── backend_api/
│   ├── api/
│   ├── backend/
│   └── manage.py
│
├── frontend/
│   ├── src/
│   └── package.json
│
└── README.md
```

---

## 🛠️ Stack technique

### Backend

* Django + DRF
* JWT + WebAuthn
* Stripe API
* CLIP (PyTorch + Transformers)

### Frontend

* React + TypeScript
* Axios
* Context API

---

## 📊 Points forts du projet

✔️ Full-stack complexe
✔️ Architecture scalable
✔️ Intégration IA réelle
✔️ Paiement en production
✔️ Sécurité avancée (Passkey)

---

## 👩‍💻 Auteur

**Sabrine Attia & Raoua BenHamed**

* GitHub: https://github.com/AttiaSabrine18
* GitHub: https://github.com/raoua123

---

## 📄 Licence

MIT License

---

<div align="center">

🧶 *Think • Create • Inspire*

</div>
