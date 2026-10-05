# 🎬 Cine Imperial

Aplicación web de gestión y compra de entradas para un cine, desarrollada como trabajo práctico para la materia **Programación IV**.

La aplicación permite consultar la cartelera, registrarse e iniciar sesión, seleccionar funciones y butacas en tiempo real, realizar compras de entradas y productos de Candy, consultar el historial de compras y utilizar diferentes funcionalidades según el rol del usuario.

## 🌐 Aplicación desplegada

**URL:** https://cine-imperial.vercel.app

## 📦 Repositorio

**GitHub:** https://github.com/Sxyro/C2-2026-Prog-IV

## 🛠️ Tecnologías utilizadas

- Angular 18+ / 22
- TypeScript
- Supabase (Database, Auth, Storage)
- PostgreSQL
- Angular Router
- Angular Service Worker / PWA
- jsPDF
- QRCode
- ZXing
- XLSX
- RxJS
- Vercel

## ✨ Funcionalidades principales

### 👤 Cliente

- Registro e inicio de sesión con captura de datos de perfil.
- Consulta de cartelera con destacados de las 3 películas más vendidas.
- Búsqueda y filtrado de películas por género.
- Consulta de información, calificaciones promedio y reseñas.
- Selección de función y mapa interactivo de butacas (incluyendo filas J y K adaptadas para personas con discapacidad y filas VIP R, S y T).
- Compra de entradas con opción de compra anónima o registrada.
- Aplicación de descuentos (cupón de primera compra y descuento para mayores de 50 años).
- Compra de productos de Candy Bar y combos destacados.
- Generación de entrada en PDF con código QR unificado.
- Consulta de próximas funciones, alertas de estreno y sección "Mis películas" (historial visual).
- Cancelación de reservas (hasta 2 horas antes de la función) con acreditación de saldo/crédito en cuenta.
- Sistema de puntos y recompensas (acumulación de 1 punto por peso gastado y canje por catálogo).
- Perfil de usuario con consulta de saldo a favor e historial de canjes.

### 🛡️ Administrador

- Gestión de películas (alta, modificación, género, clasificación por edad y preventa).
- Gestión de funciones y salas con asignación automática y validación de tiempos de limpieza (mínimo 30 minutos entre funciones).
- Gestión de usuarios y control de roles.
- Configuración de porcentajes de descuentos y cupones.
- Gestión de productos, categorías y combos de Candy.
- Gestión del catálogo de recompensas por puntos.
- Consulta y exportación de reportes de facturación a PDF y Excel.
- Visualización de estadísticas gráficas (películas y productos más vendidos por semana/mes).
- Registro e historial de actividad administrativa (`log_actividad`).

### 🎟️ Empleado

- Escaneo y validación de entradas y productos de Candy mediante código QR.
- Validación manual por código de ticket.
- Invalidación automática de códigos para evitar un segundo uso.

## 🏗️ Arquitectura del proyecto

El proyecto está organizado utilizando una arquitectura basada en funcionalidades (_feature-based_).

Estructura dentro de `src/app`:

```text
app/
├── core/
│   ├── guards/
│   │   └── admin.guard.ts
│   ├── models/
│   │   ├── alerta-pelicula.model.ts
│   │   ├── butaca.model.ts
│   │   ├── combo.model.ts
│   │   ├── configuracion.model.ts
│   │   ├── funcion.model.ts
│   │   ├── genero.model.ts
│   │   ├── pelicula.model.ts
│   │   ├── producto-candy.model.ts
│   │   ├── reportes.model.ts
│   │   ├── resena.model.ts
│   │   ├── reserva.model.ts
│   │   ├── sala.model.ts
│   │   └── usuario.model.ts
│   └── services/
│       ├── alerta-peliculas.service.ts
│       ├── candy.service.ts
│       ├── combo.service.ts
│       ├── configuracion.service.ts
│       ├── estadisticas.service.ts
│       ├── exportacion-reportes.service.ts
│       ├── funciones.service.ts
│       ├── generos.service.ts
│       ├── pdf.service.ts
│       ├── peliculas.service.ts
│       ├── puntos.service.ts
│       ├── reportes.service.ts
│       ├── resena.service.ts
│       ├── reservas.service.ts
│       ├── salas.service.ts
│       ├── supabase.service.ts
│       └── usuarios.service.ts
├── features/
│   ├── admin/
│   │   ├── candy/
│   │   ├── descuentos/
│   │   ├── funciones/
│   │   ├── panel-admin/
│   │   ├── peliculas/
│   │   ├── recompensas/
│   │   ├── reportes/
│   │   └── usuarios/
│   ├── cliente/
│   │   ├── cartelera/
│   │   ├── checkout/
│   │   ├── login/
│   │   ├── perfil/
│   │   │   ├── credito-disponible/
│   │   │   ├── mi-perfil-info/
│   │   │   ├── mis-peliculas/
│   │   │   └── recompensas/
│   │   ├── registro/
│   │   └── reserva/
│   └── empleado/
│       ├── escanear.component.css
│       ├── escanear.component.html
│       └── escanear.component.ts
├── app.config.ts
├── app.routes.ts
├── app.html
└── app.ts
```

### `core`

Centraliza la lógica de negocio reusable, la comunicación con la base de datos y la definición de tipos:

- `guards/`: Reglas de navegación que protegen rutas sensibles (ej. `admin.guard.ts`).
- `models/`: Interfaces y tipos TypeScript que mapean las entidades de la base de datos (películas, reservas, combos, usuarios, etc.).
- `services/`: Servicios singleton encargados de interactuar con Supabase (`supabase.service.ts`), administrar la autenticación, coordinar reservas, procesar puntos, generar reportes y emitir archivos PDF.

### `features`

Contiene las vistas y componentes de la aplicación, agrupados por dominio de uso:

- `cliente/`: Módulos de cara al usuario (cartelera, reservas, perfil, canjes, checkout).
- `admin/`: Paneles de gestión, configuración del sistema, catálogo de productos y reportes.
- `empleado/`: Interfaz para la verificación operativa de entradas y consumo de Candy.

### Rutas

Las rutas se definen en `app.routes.ts` implementando carga diferida (_Lazy Loading_) para optimizar el rendimiento inicial. Las secciones administrativas y de escaneo están restringidas por los guards correspondientes.

## 🗄️ Base de datos y backend

Se utilizó **Supabase** como plataforma de backend. Permite administrar:

- **PostgreSQL relacional:** tablas normalizadas con claves foráneas e integridad referencial.
- **Autenticación:** registro e inicio de sesión vinculados a la tabla `usuarios`.
- **Storage:** almacenamiento de pósters e imágenes del Candy.
- **Row Level Security (RLS):** seguridad a nivel de filas.

### Esquema de base de datos y tablas

El modelo de datos cuenta con RLS activado en todas sus tablas para restringir accesos no autorizados:

- `alertas_peliculas`
- `canjes_puntos`
- `categorias_candy`
- `combos`
- `combo_productos`
- `configuracion`
- `funciones`
- `generos`
- `log_actividad`
- `movimientos_puntos`
- `peliculas`
- `pelicula_generos`
- `productos_candy`
- `puntos_usuarios`
- `recompensas_puntos`
- `resenas`
- `reservas`
- `reserva_butacas`
- `reserva_combos`
- `reserva_productos_candy`
- `salas`
- `usuarios`

## 🔒 Seguridad

La seguridad está implementada en dos capas:

1. **Frontend (Angular):** Guards (`admin.guard.ts`) que verifican el estado de autenticación y el rol del usuario antes de resolver una ruta.
2. **Backend (Supabase RLS):** políticas de Row Level Security aplicadas directamente en PostgreSQL, impidiendo que usuarios no autorizados puedan consultar o modificar datos fuera de sus permisos.

## 🧠 Decisiones técnicas

### Angular y arquitectura modular

Se eligió Angular por su solidez para manejar proyectos con múltiples roles. La separación clara entre `core` y `features` garantiza un código ordenado y fácil de mantener.

### Supabase como BaaS

Permite integrar base de datos relacional, almacenamiento de imágenes, autenticación de usuarios y reglas de seguridad en un solo ecosistema, sin la necesidad de desplegar un servidor Node.js independiente.

### Service Worker y PWA

Se integró `@angular/pwa` para habilitar características de Progressive Web App, mejorando la velocidad de carga mediante el almacenamiento en caché de activos estáticos.

### Generación de entradas y lecturas QR

Se optó por `jsPDF` y `QRCode` para construir comprobantes completos de manera local en el cliente. Para la validación operativa del lado del empleado, se usó `ZXing`, lo que permite escanear códigos directamente con la cámara del dispositivo o ingresar el código alternativo en caso de fallos de lectura.

### Reportes en Excel

Uso de `XLSX` para generar hojas de cálculo de facturación directamente desde el panel de administración.

## 🚀 Despliegue

La aplicación se encuentra desplegada en Vercel:
https://cine-imperial.vercel.app

El código fuente está disponible en GitHub:
https://github.com/Sxyro/C2-2026-Prog-IV
