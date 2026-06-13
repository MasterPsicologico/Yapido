using UnityEngine;

namespace NarutoClash.Core
{
    /// <summary>
    /// Cámara de combate: sigue el punto medio entre los fighters con lerp suave.
    /// Shake en hits, zoom dinámico, límites del stage.
    /// </summary>
    [RequireComponent(typeof(Camera))]
    public class CameraController : MonoBehaviour
    {
        public Player.FighterController player1;
        public Player.FighterController player2;
        public float followLerp = 0.15f;
        public float zoomLerp = 0.1f;
        public float baseOrthoSize = 6f;
        public float minOrthoSize = 5f;
        public float maxOrthoSize = 9f;
        public float fightDistance = 6f;
        public Vector2 stageMin = new Vector2(-15, 0);
        public Vector2 stageMax = new Vector2(15, 8);

        public bool shakeActive = false;
        public float shakeIntensity = 0f;
        public float shakeDuration = 0f;
        public float shakeTimer = 0f;
        private Vector3 shakeOffset = Vector3.zero;

        public void Bind(Player.FighterController p1, Player.FighterController p2)
        {
            player1 = p1;
            player2 = p2;
        }

        private void LateUpdate()
        {
            if (player1 == null || player2 == null) return;

            Vector3 mid = (player1.transform.position + player2.transform.position) * 0.5f;
            float dist = Vector2.Distance(player1.transform.position, player2.transform.position);

            float zoomFactor = Mathf.Clamp01(dist / fightDistance);
            float targetSize = Mathf.Lerp(minOrthoSize, maxOrthoSize, zoomFactor);

            Vector3 targetPos = new Vector3(mid.x, mid.y, transform.position.z);
            targetPos.x = Mathf.Clamp(targetPos.x, stageMin.x, stageMax.x);
            targetPos.y = Mathf.Clamp(targetPos.y, stageMin.y, stageMax.y);

            transform.position = Vector3.Lerp(transform.position, targetPos + shakeOffset, followLerp);
            Camera.main.orthographicSize = Mathf.Lerp(Camera.main.orthographicSize, targetSize, zoomLerp);

            UpdateShake();
        }

        public void Shake(float intensity, float duration)
        {
            shakeActive = true;
            shakeIntensity = intensity;
            shakeDuration = duration;
            shakeTimer = duration;
        }

        private void UpdateShake()
        {
            if (!shakeActive) { shakeOffset = Vector3.zero; return; }
            shakeTimer -= Time.deltaTime;
            float t = Mathf.Clamp01(shakeTimer / shakeDuration);
            shakeOffset = (Vector3)Random.insideUnitCircle * shakeIntensity * t;
            if (shakeTimer <= 0) shakeActive = false;
        }
    }
}
