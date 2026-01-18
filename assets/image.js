const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("ファイル読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });

const loadImage = (dataUrl) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像読み込みに失敗しました"));
    img.src = dataUrl;
  });

export const loadImageDataUrl = async (file) => {
  try {
    return await readFileAsDataUrl(file);
  } catch (error) {
    return "";
  }
};

export const transformImage = async (dataUrl, options = {}) => {
  try {
    const img = await loadImage(dataUrl);
    const rotation = options.rotation ?? 0;
    const crop = Boolean(options.crop);

    const radians = (rotation % 360) * (Math.PI / 180);
    const isRightAngle = Math.abs(rotation % 180) === 90;
    const canvas = document.createElement("canvas");
    canvas.width = isRightAngle ? img.height : img.width;
    canvas.height = isRightAngle ? img.width : img.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radians);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    let outputCanvas = canvas;

    if (crop) {
      const size = Math.min(canvas.width, canvas.height);
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = size;
      cropCanvas.height = size;
      const cropCtx = cropCanvas.getContext("2d");
      if (cropCtx) {
        cropCtx.drawImage(
          canvas,
          (canvas.width - size) / 2,
          (canvas.height - size) / 2,
          size,
          size,
          0,
          0,
          size,
          size
        );
        outputCanvas = cropCanvas;
      }
    }

    return outputCanvas.toDataURL("image/jpeg", 0.82);
  } catch (error) {
    return dataUrl;
  }
};
