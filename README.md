# 🎯 Aprendizaje por Refuerzo

Aplicación web progresiva (PWA) para gestionar un sistema de aprendizaje por refuerzo para niños, ayudándoles a desarrollar autonomía mediante la ganancia y gasto de minutos según el cumplimiento de tareas y comportamiento.

## 🌐 Demo en Vivo

**🔗 https://sergiohiberus.github.io/kids/**

## ✨ Características

- ✅ **Gestión de Perfiles**: Crea perfiles ilimitados para cada hijo/a
- ✅ **Sistema de Tareas**: Checklist diario con recompensas (+5 Min por tarea)
- ✅ **Iniciativas**: Bonificación por acciones autónomas (+5 Min)
- ✅ **Consecuencias**: Penalizaciones rápidas por mal comportamiento (-5 a -30 Min)
- ✅ **La Banca**: Canjea minutos acumulados (15 Min o 1 Hora)
- ✅ **Bloqueo de Privilegios**: Cuando el saldo es ≤ 0
- ✅ **Gráficos de Progreso**: Visualización diaria, semanal y mensual
- ✅ **Feed de Actividad**: Últimas 5 transacciones
- ✅ **Reset Semanal**: Automático cada viernes a las 00:00
- ✅ **Diseño Moderno**: Tema oscuro y responsive para móviles

## 🚀 Inicio Rápido

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173/`

### Producción

```bash
npm run build
npm run preview
```

## 📖 Cómo Usar

### 1. Crear un Perfil

1. Haz clic en "Nuevo Perfil"
2. Ingresa el nombre del niño/a
3. Define la meta semanal en horas (ej: 5 horas)
4. Añade tareas personalizadas (opcional)
5. Haz clic en "Crear Perfil"

**Nota**: Cada perfil comienza con +60 Min (1 hora de regalo)

### 2. Gestionar Tareas Diarias

- Marca las tareas completadas haciendo clic en ellas
- Cada tarea suma +5 Min al saldo
- Las tareas se resetean diariamente

### 3. Registrar Iniciativas

- Usa el campo "Iniciativa" para acciones autónomas
- Describe la acción (máx. 255 caracteres)
- Suma +5 Min al saldo

### 4. Aplicar Consecuencias

Botones de acción rápida:
- **Falta de respeto** (Gritos/Groserías): -15 Min
- **Desorden** (Zonas comunes): -5 Min
- **Confianza** (Mentiras): -30 Min
- **Reglas Básicas** (Saltarse horarios): -15 Min

### 5. Canjear Minutos

En "La Banca":
- **Canjear 1 Hora**: -60 Min
- **Canjear 15 Minutos**: -15 Min

**⚠️ Importante**: Si el saldo es ≤ 0, aparece "Privilegios Suspendidos"

## 🔄 Reset Semanal

- **Cuándo**: Cada viernes a las 00:00
- **Qué se resetea**:
  - Saldo vuelve a +60 Min
  - Tareas diarias se desmarcan
  - Progreso semanal se reinicia

## 📱 Uso en Móvil

La app está optimizada para móviles:
1. Abre la app en el navegador móvil
2. Añade a la pantalla de inicio
3. Úsala como una app nativa

## 🛠️ Tecnologías

- **React 19** - Framework UI
- **Vite 7** - Build tool
- **Chart.js** - Gráficos
- **Lucide React** - Iconos
- **date-fns** - Manejo de fechas
- **localStorage** - Persistencia de datos

## 📦 Despliegue

La aplicación se despliega automáticamente en GitHub Pages mediante GitHub Actions.

Ver [DEPLOY.md](./DEPLOY.md) para instrucciones detalladas.

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

---

Desarrollado con ❤️ para ayudar a los niños a desarrollar autonomía y responsabilidad.
