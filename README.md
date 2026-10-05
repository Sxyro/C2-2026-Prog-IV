# Cine Imperial

Aplicación web de gestión y compra de entradas para un cine, desarrollada como trabajo práctico para la materia Programación IV.

La aplicación permite consultar la cartelera, registrarse e iniciar sesión, seleccionar funciones y butacas, realizar compras de entradas y productos de Candy, consultar el historial de compras y utilizar diferentes funcionalidades según el rol del usuario.

## Aplicación desplegada

**URL:** https://cine-imperial.vercel.app

## Repositorio

**GitHub:** https://github.com/Sxyro/C2-2026-Prog-IV

## Tecnologías utilizadas

* Angular 22
* TypeScript
* Supabase
* Supabase Authentication
* Supabase Storage
* PostgreSQL
* Angular Router
* Angular Service Worker / PWA
* jsPDF
* QRCode
* ZXing
* XLSX
* RxJS
* Vercel

## Funcionalidades principales

### Cliente

* Registro e inicio de sesión.
* Consulta de cartelera.
* Búsqueda y filtrado de películas.
* Consulta de información y reseñas.
* Selección de función y butacas.
* Compra de entradas.
* Compra de productos de Candy y combos.
* Generación de entrada en PDF con código QR.
* Consulta de próximas funciones y películas vistas.
* Cancelación de reservas cuando corresponde.
* Sistema de créditos por cancelaciones.
* Sistema de puntos y recompensas.
* Consulta del perfil y datos personales.
* Avisos de películas próximas a estrenarse.

### Administrador

* Gestión de películas.
* Gestión de géneros.
* Gestión de funciones y salas.
* Gestión de usuarios.
* Gestión de descuentos.
* Gestión de productos y combos de Candy.
* Gestión de recompensas.
* Consulta de reportes.
* Consulta de información estadística.

### Empleado

* Validación de entradas mediante código QR.
* Validación manual mediante código.
* Validación de productos de Candy.

## Arquitectura del proyecto

El proyecto está organizado utilizando la estructura de funcionalidades de Angular.

Dentro de `src/app` se encuentran principalmente:

```text
app/
├── core/
├── features/
│   ├── admin/
│   ├── cliente/
│   └── empleado/
├── app.config.ts
├── app.routes.ts
├── app.html
└── app.ts
```

### `core`

Contiene elementos centrales y compartidos de la aplicación, como servicios, modelos, guards y lógica utilizada por diferentes funcionalidades.

### `features`

Contiene las funcionalidades principales de la aplicación, organizadas según el rol y el dominio.

* `cliente/`: funcionalidades disponibles para los usuarios, como cartelera, registro, login, reservas, checkout y perfil.
* `admin/`: funcionalidades de administración del sistema.
* `empleado/`: funcionalidades relacionadas con la validación de entradas y productos mediante QR o código.

Esta organización permite separar las distintas responsabilidades de la aplicación y facilita el mantenimiento del proyecto.

### Rutas

Las rutas principales se encuentran definidas en `app.routes.ts`.

Las funcionalidades administrativas están agrupadas bajo `/admin` y protegidas mediante guards según el rol del usuario.

La ruta `/escanear` también cuenta con protección para impedir el acceso a usuarios que no tengan el rol correspondiente.

Además, algunas funcionalidades administrativas utilizan carga diferida (`loadComponent`) para cargar los componentes cuando son necesarios.

## Base de datos y backend

Se utilizó **Supabase** como backend de la aplicación.

Supabase permite gestionar:

* Base de datos PostgreSQL.
* Autenticación de usuarios.
* Almacenamiento de imágenes mediante Storage.
* Políticas de seguridad mediante Row Level Security (RLS).

La información principal de la aplicación, como películas, funciones, salas, reservas, usuarios, reseñas, productos y recompensas, se almacena en la base de datos.

## Seguridad

La aplicación utiliza autenticación mediante Supabase y control de acceso según el rol del usuario.

Además de la protección de rutas mediante guards de Angular, se utilizan políticas **Row Level Security (RLS)** en Supabase para controlar las operaciones directamente sobre la base de datos.

De esta forma, la seguridad no depende únicamente de la interfaz de la aplicación, sino que también se encuentra aplicada en el backend.

## Decisiones técnicas

### Angular

Se utilizó Angular como framework principal debido a que permite organizar la aplicación mediante componentes, servicios, rutas y otras herramientas que facilitan la separación de responsabilidades.

### Organización por funcionalidades

Se decidió organizar las funcionalidades dentro de `features`, separando cliente, administrador y empleado.

Esto permite mantener una estructura clara y facilita encontrar y modificar cada parte del sistema.

### Supabase

Se eligió Supabase para evitar implementar un backend independiente y contar con una solución integrada para base de datos, autenticación, almacenamiento y seguridad mediante RLS.

### Guards y roles

Se utilizaron guards para controlar el acceso a determinadas rutas según el rol del usuario.

Esto permite evitar que un usuario acceda desde la interfaz a funcionalidades que corresponden exclusivamente al administrador o empleado.

### PWA

Se incorporó Angular Service Worker para que la aplicación pueda funcionar como Progressive Web App (PWA).

### Generación de entradas y códigos QR

Se utilizaron `jsPDF` para generar las entradas en formato PDF y `QRCode` para generar los códigos QR utilizados en la validación.

Para la lectura de códigos QR se utilizó `ZXing`.

### Reportes

Se utilizó `XLSX` para permitir la generación de reportes en formato Excel.

## Despliegue

La aplicación se encuentra desplegada en **Vercel** y puede ser utilizada mediante la URL:

https://cine-imperial.vercel.app

El código fuente se encuentra disponible en GitHub:

https://github.com/Sxyro/C2-2026-Prog-IV
