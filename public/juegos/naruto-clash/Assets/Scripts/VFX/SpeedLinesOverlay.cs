using UnityEngine;
using UnityEngine.UI;

namespace NarutoClash.VFX
{
    /// <summary>
    /// Overlay de líneas de velocidad estilo manga/anime para cinemáticas
    /// de Rasengan / super moves. UI RawImage con shader procedural.
    /// </summary>
    public class SpeedLinesOverlay : MonoBehaviour
    {
        public CanvasGroup canvasGroup;
        public float fadeIn = 0.05f;
        public float fadeOut = 0.4f;
        public bool isShowing = false;
        private float timer = 0f;
        private float duration = 0f;

        private void Awake()
        {
            if (canvasGroup == null) canvasGroup = GetComponent<CanvasGroup>();
            if (canvasGroup != null) canvasGroup.alpha = 0f;
        }

        public void Show(float dur)
        {
            isShowing = true;
            duration = dur;
            timer = dur;
        }

        private void Update()
        {
            if (!isShowing || canvasGroup == null) return;
            float half = duration * 0.2f;
            float t = timer;
            if (t > duration - half) canvasGroup.alpha = Mathf.Clamp01((duration - t) / half * (1f / fadeIn));
            else canvasGroup.alpha = Mathf.Clamp01(t / (duration - half) * fadeOut);
            timer -= Time.deltaTime;
            if (timer <= 0)
            {
                isShowing = false;
                canvasGroup.alpha = 0f;
            }
        }
    }
}
