using UnityEngine;

namespace NarutoClash.VFX
{
    /// <summary>
    /// Camera zoom + position lerp para cinemáticas de super moves.
    /// Estilo BlazBlue: zoom rápido a 1.5x, mantiene, vuelve a 1x.
    /// </summary>
    public class CinematicZoom : MonoBehaviour
    {
        public Camera mainCamera;
        public float defaultSize = 6f;
        public float currentSize = 6f;
        public Vector3 defaultOffset = Vector3.zero;
        public Vector3 targetPosition;
        public bool isZooming = false;
        public float holdTimer = 0f;

        public void Trigger(Vector3 focusPos, float zoomIn, float zoomOut)
        {
            isZooming = true;
            targetPosition = focusPos;
            currentSize = defaultSize * zoomIn;
            holdTimer = zoomOut;
        }

        private void LateUpdate()
        {
            if (mainCamera == null) return;

            if (isZooming)
            {
                mainCamera.orthographicSize = Mathf.Lerp(mainCamera.orthographicSize, currentSize, 0.25f);
                mainCamera.transform.position = Vector3.Lerp(
                    mainCamera.transform.position,
                    new Vector3(targetPosition.x, targetPosition.y, mainCamera.transform.position.z),
                    0.2f);
                holdTimer -= Time.deltaTime;
                if (holdTimer <= 0)
                {
                    isZooming = false;
                }
            }
            else
            {
                mainCamera.orthographicSize = Mathf.Lerp(mainCamera.orthographicSize, defaultSize, 0.05f);
            }
        }

        public void Shake(float intensity, float duration)
        {
            StartCoroutine(ShakeRoutine(intensity, duration));
        }

        private System.Collections.IEnumerator ShakeRoutine(float intensity, float duration)
        {
            float t = 0f;
            Vector3 original = mainCamera.transform.position;
            while (t < duration)
            {
                mainCamera.transform.position = original + (Vector3)Random.insideUnitCircle * intensity * (1f - t / duration);
                t += Time.deltaTime;
                yield return null;
            }
            mainCamera.transform.position = original;
        }
    }
}
