using UnityEngine;

namespace NarutoClash.Core
{
    /// <summary>
    /// Pool genérico de GameObjects (VFX, proyectiles, hit sparks).
    /// </summary>
    public class ObjectPool : MonoBehaviour
    {
        public static ObjectPool Instance { get; private set; }

        [System.Serializable]
        public class PoolEntry
        {
            public GameObject prefab;
            public int prewarmed = 4;
            [System.NonSerialized] public System.Collections.Generic.Queue<GameObject> inactive;
        }

        public PoolEntry[] pools;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            if (pools == null) return;
            for (int i = 0; i < pools.Length; i++)
            {
                var entry = pools[i];
                if (entry == null || entry.prefab == null) continue;
                entry.inactive = new System.Collections.Generic.Queue<GameObject>();
                for (int n = 0; n < entry.prewarmed; n++)
                {
                    var go = Instantiate(entry.prefab);
                    go.SetActive(false);
                    go.transform.SetParent(transform);
                    entry.inactive.Enqueue(go);
                }
            }
        }

        public GameObject Spawn(GameObject prefab, Vector3 pos, Quaternion rot, Transform parent = null)
        {
            PoolEntry entry = FindEntry(prefab);
            GameObject go;
            if (entry != null && entry.inactive != null && entry.inactive.Count > 0)
            {
                go = entry.inactive.Dequeue();
                go.transform.SetParent(parent);
                go.transform.SetPositionAndRotation(pos, rot);
                go.SetActive(true);
            }
            else
            {
                go = Instantiate(prefab, pos, rot, parent);
            }

            var poolable = go.GetComponent<IPoolable>();
            if (poolable != null) poolable.OnSpawned();
            return go;
        }

        public void Despawn(GameObject go, float delay = 0f)
        {
            if (go == null) return;
            if (delay > 0) { Invoke(nameof(DelayedDespawn), delay); _pending = go; return; }
            DespawnNow(go);
        }

        private GameObject _pending;
        private void DelayedDespawn() { if (_pending != null) DespawnNow(_pending); _pending = null; }

        private void DespawnNow(GameObject go)
        {
            if (go == null) return;
            var poolable = go.GetComponent<IPoolable>();
            if (poolable != null) poolable.OnDespawned();
            PoolEntry entry = FindEntryByInstance(go);
            go.SetActive(false);
            if (entry != null)
            {
                go.transform.SetParent(transform);
                if (entry.inactive == null) entry.inactive = new System.Collections.Generic.Queue<GameObject>();
                entry.inactive.Enqueue(go);
            }
            else
            {
                Destroy(go);
            }
        }

        private PoolEntry FindEntry(GameObject prefab)
        {
            if (pools == null) return null;
            for (int i = 0; i < pools.Length; i++) if (pools[i] != null && pools[i].prefab == prefab) return pools[i];
            return null;
        }

        private PoolEntry FindEntryByInstance(GameObject go)
        {
            if (pools == null) return null;
            for (int i = 0; i < pools.Length; i++) if (pools[i] != null && pools[i].prefab.name == go.name.Replace("(Clone)", "")) return pools[i];
            return null;
        }
    }

    public interface IPoolable
    {
        void OnSpawned();
        void OnDespawned();
    }
}
