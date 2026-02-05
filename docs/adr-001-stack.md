# ADR 001 — Selección de stack

**Fecha:** 2025-09-09
**Estado:** aceptado

## Contexto

El prototipo validado es una app móvil. Necesitamos un producto funcional que el
equipo pueda desplegar y mostrar en un enlace, con backend real y pruebas.

## Decisión

- **Backend:** NestJS + TypeScript. La estructura modular por dominio se mapea uno
  a uno con los módulos del prototipo (auth, vehicles, services, appointments,
  chatbot, tracking) y trae validación, DI y testing de fábrica.
- **ORM:** Prisma sobre PostgreSQL. Migraciones versionadas y tipos generados.
- **Frontend:** React + Vite + TypeScript + Tailwind, como **PWA mobile-first**.
  Reproduce el wireframe a 390px y es instalable en el teléfono, sin el costo de
  publicar en tiendas.
- **Pruebas:** Jest + Supertest (API), Vitest + Testing Library (web),
  Playwright (E2E).
- **Despliegue:** contenedores Docker, CI en GitHub Actions.

## Alternativas descartadas

- **React Native / Expo:** más fiel al prototipo, pero el enlace de demo requiere
  build nativo o Expo Go. Se descarta para esta entrega.
- **Monolito Express + plantillas:** más simple, pero no permite separar equipos ni
  reutilizar la API si más adelante se hace la app nativa.

## Consecuencias

La capa de dominio queda en la API, de modo que un cliente React Native futuro
consume los mismos endpoints sin reescribir lógica.
