<div align="center">

# IAhorra CERTUS 2.0
### Solucion EdFinTech con Inteligencia Artificial Generativa

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-magenta.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://iahorra-certus.vercel.app)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)](https://firebase.google.com)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google)](https://ai.google.dev)

### [iahorra-certus.vercel.app](https://iahorra-certus.vercel.app)

</div>

---

## Que es IAhorra CERTUS

IAhorra CERTUS es una aplicacion web progresiva (PWA) de tipo **EdFinTech** que combina educacion financiera y herramientas practicas de gestion del dinero para estudiantes.

Su objetivo es transformar el aprendizaje financiero en acciones diarias medibles: planificar presupuesto, crear metas de ahorro, simular escenarios y hacer seguimiento del progreso con una experiencia simple, instalable y centrada en el usuario.

Ademas, integra IA generativa (Gemini) para acompanamiento conversacional y orientacion financiera contextual.

---

## Impacto inicial del piloto

- 51 usuarios activos
- 25 ahorros registrados
- 57 metas creadas
- 130 puntos de progreso acumulados

---

## Funcionalidades principales

| Modulo | Descripcion |
|--------|-------------|
| Chat IA Personalizado | Asistente financiero con IA adaptado al perfil del usuario |
| Simulador de Ahorro | Proyeccion de ahorro en el tiempo con apoyo visual |
| Presupuesto Personal | Registro de ingresos y gastos para calcular capacidad de ahorro |
| Metas Financieras | Creacion y seguimiento de metas en tiempo real |
| Panel de Progreso | Evolucion personal y logros financieros |
| Educacion Financiera | Contenido educativo y recomendaciones accionables |
| Modo Invitado | Exploracion sin registro para demos y adopcion rapida |

---

## Stack tecnologico

```text
Frontend      -> React 19 + TypeScript + Vite + Tailwind CSS 4
IA Generativa -> Google Gemini AI (@google/genai)
Backend BaaS  -> Firebase (Firestore + Authentication)
PWA           -> Service Worker + Manifest + instalacion en movil/escritorio
Hosting       -> Vercel (HTTPS, CDN global, despliegue continuo)
```

---

## Arquitectura PWA

- Instalacion en Android, iOS y escritorio (Chrome/Brave/Edge/Safari)
- Soporte offline parcial con cache de recursos criticos
- Iconografia y branding optimizados para favicon, launcher y prompt de instalacion
- Estrategia de versionado para refresco de manifest e iconos

---

## Ejecucion local

### 1. Clonar repositorio

```bash
git clone https://github.com/DiegoVCH18/iahorra-certus.git
cd iahorra-certus
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Variables de entorno

Crear un archivo `.env` con las credenciales requeridas (Firebase y Gemini), por ejemplo:

```bash
VITE_GEMINI_API_KEY=tu_api_key
```

### 4. Levantar entorno de desarrollo

```bash
npm run dev
```

### 5. Build de produccion

```bash
npm run build
npm run preview
```

---

## Despliegue

El proyecto esta desplegado en Vercel y conectado al repositorio para CI/CD automatico en cada push a `main`.

- URL productiva: [iahorra-certus.vercel.app](https://iahorra-certus.vercel.app)

---

## Antecedente institucional

**Semana Mundial del Ahorro 2025 - SBS Peru**

- 1er lugar - Categoria: Propuesta Innovadora de Educacion Financiera
- Finalista - Categoria: Entidad mas colaboradora
- Finalista - Categoria: Mayor alcance virtual

Nota oficial:
[Certus gana premio a la innovacion en educacion financiera con su asistente virtual IAhorra](https://www.certus.edu.pe/blog/certus-gana-premio-a-la-innovacion-en-educacion-financiera-con-su-asistente-virtual-iahorra/)

---

## Autor

**Ing. Diego Armando Vasquez Chavez**  
CIP 337613  
Docente de Tiempo Completo (PTC)  
Coordinacion Academica - Carrera de Administracion Financiera y Banca Digital  
CERTUS - Escuela de Educacion Superior  

Contacto: dvasquezc@certus.edu.pe

---

## Licencia

Este proyecto esta bajo la licencia **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.

Puedes compartir y adaptar el material siempre que se otorgue credito al autor y no se use con fines comerciales.

Para uso comercial o institucional: dvasquezc@certus.edu.pe

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-magenta.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

---

<div align="center">

Desarrollado para fortalecer la educacion financiera en Peru

**[iahorra-certus.vercel.app](https://iahorra-certus.vercel.app)**

</div>
