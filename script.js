
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const overlayImg = document.getElementById('overlayImg');
const thumbs = document.querySelectorAll('.thumb');
const captureBtn = document.getElementById('capture');

// カメラ起動
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment",
                width:  { ideal: 4096 },    // できるだけ大きな幅
                height: { ideal: 4096 }     // できるだけ大きな高さ
            }
        });
        video.srcObject = stream;
    } catch (err) {
        alert("カメラにアクセスできません: " + err.message);
    }
}

// サムネイルクリックで切り替え
thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
        // overlay画像を切り替え
        overlayImg.src = thumb.dataset.src;

        // 選択状態の見た目を更新
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
    });
});

// 撮影処理（撮影後すぐ新しいタブで開く）
captureBtn.addEventListener('click', () => {
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // カメラ映像を描画
    ctx.drawImage(video, 0, 0, w, h);
    if (overlayImg.complete) {
        const imgAspect = overlayImg.naturalWidth / overlayImg.naturalHeight;
        const canvasAspect = w / h;

        let drawW, drawH, offsetX, offsetY;

        if (imgAspect > canvasAspect) {
            // 画像が横長 → 幅に合わせる
            drawW = w;
            drawH = w / imgAspect;
            offsetX = 0;
            offsetY = (h - drawH) / 2;
        } else {
            // 画像が縦長 → 高さに合わせる
            drawH = h;
            drawW = h * imgAspect;
            offsetX = (w - drawW) / 2;
            offsetY = 0;
        }

        ctx.drawImage(overlayImg, offsetX, offsetY, drawW, drawH);
    }
      
    // 新しいタブに画像を埋め込んだHTMLを表示
    const url = canvas.toDataURL("image/png");
    const win = window.open();
    const img = win.document.createElement("img");
    img.src = url;
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    win.document.body.appendChild(img);
});

startCamera();
