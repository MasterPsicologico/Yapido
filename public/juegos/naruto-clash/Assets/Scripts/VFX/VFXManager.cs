using UnityEngine;
using NarutoClash.Core;

namespace NarutoClash.VFX
{
    /// <summary>
    /// Singleton. Spawnea y recicla VFX Graph instances (Rasengan, Chidori,
    /// Amaterasu, Kirin, sustitución) para evitar instanciar/destruir.
    /// </summary>
    public class VFXManager : MonoBehaviour
    {
        public static VFXManager Instance { get; private set; }

        [Header("VFX Prefabs (VFX Graph)")]
        public GameObject rasenganVFX;
        public GameObject chidoriVFX;
        public GameObject amaterasuVFX;
        public GameObject kirinCloudVFX;
        public GameObject kirinLightningVFX;
        public GameObject substitutionLogPrefab;
        public GameObject substitutionSmokePrefab;
        public GameObject hitImpactVFX;
        public GameObject blockImpactVFX;

        [Header("Cinematic")]
        public CinematicZoom cinematicZoom;
        public SpeedLinesOverlay speedLines;

        private void Awake()
        {
            if (Instance == null) Instance = this;
        }

        public GameObject SpawnRasengan(Vector3 pos) => Spawn(rasenganVFX, pos);
        public GameObject SpawnChidori(Transform parent) => SpawnAttached(chidoriVFX, parent);
        public GameObject SpawnAmaterasu(Vector3 pos) => Spawn(amaterasuVFX, pos);
        public GameObject SpawnKirinCloud(Vector3 pos) => Spawn(kirinCloudVFX, pos);
        public GameObject SpawnKirinLightning(Vector3 pos) => Spawn(kirinLightningVFX, pos);
        public GameObject SpawnSubstitutionLog(Vector3 pos) => Spawn(substitutionLogPrefab, pos);
        public GameObject SpawnSubstitutionSmoke(Vector3 pos) => Spawn(substitutionSmokePrefab, pos);
        public GameObject SpawnHitImpact(Vector3 pos) => Spawn(hitImpactVFX, pos);
        public GameObject SpawnBlockImpact(Vector3 pos) => Spawn(blockImpactVFX, pos);

        private GameObject Spawn(GameObject prefab, Vector3 pos)
        {
            if (prefab == null) return null;
            GameObject go = ObjectPool.Instance != null
                ? ObjectPool.Instance.Spawn(prefab, pos, Quaternion.identity)
                : Instantiate(prefab, pos, Quaternion.identity);
            return go;
        }

        private GameObject SpawnAttached(GameObject prefab, Transform parent)
        {
            if (prefab == null) return null;
            GameObject go = ObjectPool.Instance != null
                ? ObjectPool.Instance.Spawn(prefab, parent.position, parent.rotation, parent)
                : Instantiate(prefab, parent);
            go.transform.localPosition = Vector3.zero;
            return go;
        }

        public void TriggerRasenganSequence(Vector3 originPos, Vector3 targetPos)
        {
            if (cinematicZoom != null) cinematicZoom.Trigger(targetPos, 0.4f, 1.6f);
            if (speedLines != null) speedLines.Show(0.4f);
            TimeManager.Instance.Freeze(0.5f);
            GameObject r = SpawnRasengan(originPos);
            if (r != null)
            {
                Projectiles.Projectile p = r.GetComponent<Projectiles.Projectile>();
                if (p != null) p.TravelTo(targetPos, 12f, 0.15f);
            }
        }

        public void TriggerKirinSequence(Vector3 targetPos)
        {
            Vector3 cloudPos = targetPos + new Vector3(0, 12, 0);
            SpawnKirinCloud(cloudPos);
            if (cinematicZoom != null) cinematicZoom.Trigger(targetPos, 0.2f, 0.7f);
            Invoke(nameof(FireKirinBolt), 0.8f);
        }

        private void FireKirinBolt()
        {
            GameObject bolt = kirinLightningVFX;
            // Procedural lightning call: would invoke a LightningGenerator here
            // that uses noise to draw a segmented line from cloud to ground.
        }
    }
}
