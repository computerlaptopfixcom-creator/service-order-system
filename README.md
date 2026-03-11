# 🚀 Computer Laptop Fix System v2.0
<!-- Created by HielOS -->
> **Portal de Gestión Profesional para Talleres con Sistema de Cliente sin Contraseñas.**

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

Sistema profesional diseñado para optimizar el flujo de trabajo en talleres de reparación. Su principal innovación es un **portal de cliente seguro y simplificado** que elimina la fricción de las contraseñas, permitiendo a los clientes seguir sus órdenes, ver fotos de evidencia y aprobar presupuestos directamente desde su móvil.

---
## ✨ Características Principales

### 🔐 Portal de Cliente (Novedad v2.0)
- **Sin contraseñas**: Verificación por teléfono + número de orden
- **Tokens seguros**: JWT con expiración de 24 horas
- **Fotos de evidencia**: Cliente ve las fotos del equipo desde su celular
- **Historial en tiempo real**: Seguimiento completo del estado
- **Aprobación de presupuestos**: Cliente aprueba/rechaza costos extra con firma digital al aprobar
- **Notificaciones WhatsApp**: Enlace automático al portal del cliente

### 🛠 Gestión Completa
- **Órdenes de servicio**: Crear, editar, cambiar estado (con botón rápido "Listo para Entrega"), imprimir recibos
- **Inventario de partes**: Control de stock con alertas de bajo inventario
- **Servicios**: Catálogo de servicios con precios y asignación de partes
- **Reportes**: Estadísticas de órdenes, ganancias y costos
- **Centro de notificaciones**: Alertas al admin cuando un cliente aprueba o rechaza presupuesto
- **Respaldos**: Exportación en CSV (Excel) y ZIP completo (DB + Config)

### 📱 Experiencia Cliente
- **Consulta pública**: Los clientes buscan su orden desde la página principal
- **Verificación segura**: Solo teléfono + número de orden (mínimo 4 dígitos)
- **Galería de fotos**: Documentación visual del equipo
- **Presupuestos interactivos**: Diagnóstico detallado + comentarios opcionales + firma para aprobar
- **Estado en vivo**: Barra de progreso visual del servicio

### 🔧 Herramientas Administrativas
- **Firma digital**: Captura de firma al recibir el equipo y al aprobar presupuesto
- **Botones de acción rápida**: Cambiar a "Listo para Entrega" con un clic desde el detalle de orden
- **Notificaciones WhatsApp**: Mensajes automáticos personalizados
- **Personalización**: Logo, colores, horarios, plantillas
- **Multi-dispositivo**: Responsive 100% para móviles y escritorio

## 📋 Requisitos

- [Node.js](https://nodejs.org) v18 o superior
- Navegador web moderno

## ⚙️ Instalación Local (Desarrollo)

### 1. Clona el repositorio
```bash
git clone https://github.com/computerlaptopfixcom-creator/service-order-system.git
cd service-order-system
```

### 2. Instala dependencias
```bash
npm install
```

### 3. Genera el cliente de Prisma
```bash
npx prisma generate
```

### 4. Inicializa la base de datos
```bash
npx prisma db push
```

### 5. Configura variables de entorno (opcional)
```bash
cp .env.local.example .env.local
# Edita .env.local con tu contraseña preferida
```

### 6. Inicia en modo desarrollo
```bash
npm run dev
```

### 7. Abre tu navegador
Accede a **http://localhost:3000**

## 🐳 Despliegue con Docker

### Opción 1: Docker Compose (Recomendado)
```bash
# Un solo comando para todo:
docker compose up -d

# Ver logs:
docker compose logs -f
```

### Opción 2: Docker manual
```bash
# Construir imagen
docker build -t sistema-taller .

# Correr contenedor
docker run -d \
  -p 3000:3000 \
  -v taller-data:/app/data \
  -e ADMIN_PASSWORD=tu_contraseña \
  -e AUTH_SECRET=secreto-largo-aqui \
  --name taller \
  sistema-taller
```

## ☁️ Despliegue en Easypanel

1. **Crea un servicio nuevo** → Selecciona **"App"** → **"GitHub"**
2. **Conecta tu repo**: `computerlaptopfixcom-creator/service-order-system`
3. **Branch**: `main`
4. **Build method**: `Dockerfile` (ya incluido en el repo)
5. **Configura el dominio**: Puerto **3000**
6. **Variables de entorno** (en la pestaña Environment):
   ```
   ADMIN_PASSWORD=tu_contraseña_segura
   AUTH_SECRET=un-secreto-largo-aqui
   ```
7. **Deploy** → ¡Listo! 🎉

> **Nota**: La base de datos SQLite se guarda en `/app/data/`. Configura un volumen persistente en Easypanel para no perder datos al redeploy.

## 🔑 Acceso

### Panel de Administración
- **URL**: `http://tu-dominio/admin`
- **Contraseña por defecto**: `admin123`

Para cambiar la contraseña, configura la variable de entorno `ADMIN_PASSWORD`.

### Portal de Cliente
- **URL**: `http://tu-dominio/orden/[NUMERO_ORDEN]`
- **Acceso**: Teléfono + número de orden (verificación automática)

## 🎯 Personalización

Ve a **Admin → Configuración** para personalizar:

- Nombre del negocio y logo
- Teléfono, email, dirección
- Número de WhatsApp
- Horario de atención
- Color de marca
- Plantillas de mensajes WhatsApp
- Umbral de stock bajo
- Moneda y país

## 📊 Reportes y Respaldos

En **Admin → Configuración → Respaldo de Información**:

- **CSV**: Exporta órdenes para Excel
- **ZIP**: Backup completo descargable desde el panel (DB + Configuración)

## 🏗️ Arquitectura Técnica

### Stack
- **Frontend**: Next.js 14 App Router + TypeScript
- **Estilos**: TailwindCSS
- **Base de datos**: SQLite (Local en `/data/taller.db`) con Prisma ORM
- **Autenticación**: Tokens JWT con HMAC-SHA256
- **Deployment**: Docker con `output: standalone`

### Estructura
```
├── src/
│   ├── app/
│   │   ├── admin/           # Panel administrativo
│   │   ├── api/             # Rutas API
│   │   ├── orden/           # Portal cliente
│   │   └── page.tsx         # Página pública
│   ├── components/          # Componentes UI
│   ├── lib/                # Lógica de negocio
│   └── types/              # Tipos TypeScript
├── prisma/                 # Schema de base de datos
├── data/                   # Base de datos SQLite (se crea automático)
├── Dockerfile             # Configuración Docker
├── docker-compose.yml     # Deploy con un comando
└── next.config.js         # Configuración Next.js
```

## 🌟 Novedades v2.0

- ✨ **Portal de cliente sin contraseñas**
- 🔐 **Tokens JWT seguros con expiración**
- 📱 **Galería de fotos para clientes**
- 💰 **Aprobación de presupuestos online con firma digital**
- 🔔 **Notificaciones al admin por aprobación/rechazo**
- 🔔 **Integración mejorada con WhatsApp**
- 📊 **UI/UX optimizada para móviles**
- ⚡ **Mejoras de rendimiento con SQLite y Prisma**

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Siéntete libre de:
- Reportar bugs
- Sugerir mejoras
- Enviar pull requests
- Compartir tu experiencia usando el sistema

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**. Puedes usarlo, modificarlo y distribuirlo libremente, tanto para uso personal como comercial. Consulta el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

¿Tienes preguntas?
- 📧 Crea un issue en GitHub
- 💬 Comenta en el repositorio
- 🔄 Revisa las discusiones existentes

---

**⭐ Si te gusta el proyecto, ¡dale una estrella en GitHub!**

🔗 **Repositorio**: https://github.com/computerlaptopfixcom-creator/service-order-system
