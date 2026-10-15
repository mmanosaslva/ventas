# Despliegue a producción (Vercel)

Guía para mergear y desplegar la rama con **combos, filtros de ventas y el nuevo sidebar**.

> El cambio de esquema solo **agrega**: las tablas `Combo` y `ComboItem`, la columna `Product.stock` y las columnas `Sale.productId` / `Sale.comboId`. Todas son opcionales (nullables), así que **no modifica ni borra datos existentes** y los productos actuales siguen vendiéndose igual (sin control de inventario hasta que se les ponga stock). Aun así, el orden de los pasos importa.

## Por qué el orden importa

El script de build es solo `next build`. Vercel **no** crea tablas. Si el código nuevo se despliega antes de crear las tablas en la base de producción:

- `/combos` falla.
- **Eliminar un producto falla** (ahora consulta `ComboItem` antes de borrar).
- **Registrar, editar y eliminar ventas falla**, y la lista de productos también (el código ya lee `stock`, `productId` y `comboId`).
- Solo el login seguiría funcionando.

Por eso: **primero la base de datos, después el merge.**

## 0. Antes de empezar

- [ ] Tienes la `DATABASE_URL` de **producción** (Vercel → proyecto → Settings → Environment Variables).
- [ ] Sabes que **no es** la del Docker local (`localhost:5433`).
- [ ] Tienes permiso de escritura en el repo, o hiciste un fork.

## 1. Probar en local

El entorno local usa Postgres en Docker (aislado, puerto 5433):

```bash
docker start ventas-db      # si está parado
npm run dev                 # http://localhost:3000
```

Comprueba a mano:

- [ ] Login con el admin.
- [ ] Crear un producto y un combo (incluido un dúo: mismo producto ×2).
- [ ] Registrar una venta de un producto y otra de un combo.
- [ ] En `/ventas`: filtros, orden y "Agrupar por producto".
- [ ] No se puede eliminar un producto que está dentro de un combo.
- [ ] Inventario: producto con stock 3, intentar vender 5 → se rechaza con aviso; vender un combo descuenta cada artículo; editar/eliminar una venta ajusta el stock.
- [ ] Revisar a ancho móvil, tablet y laptop.

Verificación automática:

```bash
npx tsc --noEmit
npm run lint
npm run build      # ¡con `npm run dev` detenido! Ambos escriben en .next
```

## 2. Crear la rama y el commit

```bash
git switch -c feat/combos-y-ui
git add -A
git status                  # confirma que NO aparece .env
git commit -m "feat: combos, filtros de ventas, sidebar y componentes UI"
git push -u origin feat/combos-y-ui
```

Abre el Pull Request en GitHub hacia `main`. Si el repo es de otra cuenta y no tienes permiso, haz un fork y abre el PR desde ahí.

Sugerencia para la descripción del PR:

```
## Qué incluye
- Combos (modelo Combo/ComboItem, API, página /combos, venta de combos)
- Página de ventas: lista única con filtros, orden y agrupación
- Navbar reemplazado por sidebar responsive
- Componentes UI propios: Select, Field (contraseña con ojo), iconos

## Antes de mergear
Correr `npx prisma db push` contra la base de producción (solo agrega tablas).
```

## 3. Revisar el preview de Vercel

Si Vercel genera un *preview deploy* para el PR, ábrelo y revisa. **Ojo:** el preview usa las variables de entorno del entorno "Preview". Si apuntan a la base de producción, el código nuevo sin tablas fallará igual en `/combos`. No es grave en un preview, pero tenlo presente.

## 4. Actualizar la base de producción

**Esto toca producción.** Hazlo con calma, justo antes del merge.

1. Haz un respaldo (si tu proveedor lo permite, o con `pg_dump`):
   ```bash
   pg_dump "URL_DE_PRODUCCION" > respaldo-antes-de-combos.sql
   ```
2. Aplica el esquema apuntando a producción **solo para este comando**:
   ```bash
   DATABASE_URL="URL_DE_PRODUCCION" npx prisma db push
   ```
   Prisma debe indicar que **crea** `Combo` y `ComboItem` y **agrega** columnas (`stock`, `productId`, `comboId`). Si propone **borrar o modificar** algo existente, **detente** y revisa antes de aceptar.
3. **No ejecutes `npx prisma db seed` en producción.** El seed restablece la contraseña del admin a `Admin2026` (ver [prisma/seed.ts](prisma/seed.ts)).

No guardes la URL de producción en tu `.env` local. El `.env` debe seguir apuntando al Docker.

## 5. Variables de entorno en Vercel

Verifica en Settings → Environment Variables (entorno *Production*):

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | URL de la base de producción |
| `NEXTAUTH_SECRET` | cadena larga y aleatoria (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL pública de la app, p. ej. `https://tu-app.vercel.app` |

No se añadieron variables nuevas en este cambio.

## 6. Mergear y desplegar

1. Mergea el PR a `main`. Vercel despliega solo.
2. Espera a que el deploy termine en verde.

## 7. Comprobar después del despliegue

- [ ] Login funciona.
- [ ] `/combos` abre y lista (vacío está bien).
- [ ] Crear un combo de prueba y registrar una venta con él.
- [ ] Eliminar un producto que **no** esté en un combo funciona.
- [ ] Un producto existente (sin stock) se sigue vendiendo con normalidad.
- [ ] Ponerle stock a un producto, venderlo y comprobar que baja; borrar esa venta y comprobar que sube.
- [ ] `/ventas` muestra las ventas anteriores con sus montos intactos.
- [ ] Prueba rápida en el celular.

Borra el combo y la venta de prueba al terminar.

## Si algo sale mal

- **Volver al código anterior:** en Vercel → Deployments → elige el deploy previo → *Promote to Production* (rollback instantáneo).
- **Las tablas nuevas pueden quedarse.** Son aditivas y el código anterior las ignora, así que no hace falta revertir la base.
- **Restaurar datos:** solo si algo se dañó, con el respaldo del paso 4.

## Notas de seguridad pendientes

- La contraseña del admin (`Admin2026`) está en texto plano en [prisma/seed.ts](prisma/seed.ts) y en el historial de git. Cámbiala desde la app tras el primer despliegue y valora sacarla del código.
- `.env` está en `.gitignore`; confirma con `git status` antes de cada commit.
