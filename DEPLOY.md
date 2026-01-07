# Despliegue en GitHub Pages

## 📋 Pasos para activar GitHub Pages

### 1. Habilitar GitHub Pages en el repositorio

1. Ve a tu repositorio en GitHub: `https://github.com/SergioHiberus/kids`
2. Haz clic en **Settings** (Configuración)
3. En el menú lateral, busca **Pages** (en la sección "Code and automation")
4. En **Source** (Fuente), selecciona:
   - **Source**: `GitHub Actions`
5. Guarda los cambios

### 2. El workflow se ejecutará automáticamente

El workflow de GitHub Actions (`.github/workflows/deploy.yml`) se ejecutará automáticamente:
- ✅ Cada vez que hagas push a la rama `main`
- ✅ Manualmente desde la pestaña "Actions" en GitHub

### 3. Verificar el despliegue

1. Ve a la pestaña **Actions** en tu repositorio
2. Verás el workflow "Deploy to GitHub Pages" ejecutándose
3. Espera a que termine (tarda ~2-3 minutos)
4. Una vez completado, tu app estará disponible en:
   
   **🌐 https://sergiohiberus.github.io/kids/**

## 🔧 Configuración realizada

### Archivos modificados:

1. **`vite.config.js`**
   ```javascript
   base: '/kids/'  // Ruta base para GitHub Pages
   ```

2. **`.github/workflows/deploy.yml`**
   - Workflow de GitHub Actions
   - Build automático con Node.js 20
   - Deploy a GitHub Pages

### Build local

Para verificar el build localmente:
```bash
npm run build
npm run preview
```

## 🚀 Próximos pasos

1. **Habilita GitHub Pages** siguiendo los pasos de arriba
2. **Espera el deploy** (verás el progreso en Actions)
3. **Accede a la app** en `https://sergiohiberus.github.io/kids/`

## 📝 Notas

- Los cambios se despliegan automáticamente al hacer push a `main`
- El build tarda aproximadamente 2-3 minutos
- La app usa localStorage, así que los datos se guardan localmente en cada navegador
- Compatible con móviles (añadir a pantalla de inicio para experiencia tipo app)

## 🔄 Actualizar la app

Simplemente haz cambios y push:
```bash
git add .
git commit -m "tu mensaje"
git push origin main
```

El workflow se ejecutará automáticamente y actualizará la app en GitHub Pages.
