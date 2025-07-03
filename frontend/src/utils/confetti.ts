// utils/confetti.ts
import confetti from "canvas-confetti";

export function fireFullScreenConfetti() {
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    canvas.style.transition = "opacity 1s ease";
    canvas.style.opacity = "1";

    document.body.appendChild(canvas);

    const instance = confetti.create(canvas, { resize: true });

    // Launch confetti
    instance({
        particleCount: 150,
        spread: 160,
        origin: { x: 0.5, y: 0.5 },
    });

    // Start fading out after 1 second
    setTimeout(() => {
        canvas.style.opacity = "0";

        // Then remove canvas after fade completes
        setTimeout(() => {
            canvas.remove();
        }, 1000); // match transition duration
    }, 1000);
}
