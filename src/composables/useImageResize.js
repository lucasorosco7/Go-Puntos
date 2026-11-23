/**
 * Achica una imagen elegida por la persona y la devuelve como dataURL.
 *
 * Mientras se usan datos simulados, la imagen se guarda así dentro del
 * negocio o la recompensa. Con el backend, ImagePicker subirá el archivo a
 * la API (POST /uploads) y guardará la URL que devuelva.
 */
export function resizeImage(file, maxSize = 320) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('No pudimos leer la imagen.'));
    img.src = URL.createObjectURL(file);
  });
}
