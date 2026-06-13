using UnityEngine;
using NarutoClash.ScriptableObjects;
using NarutoClash.VFX;
using NarutoClash.Core;

namespace NarutoClash.Projectiles
{
    /// <summary>
    /// Proyectil genérico: kunai, shuriken, Rasengan, Chidori, Amaterasu, Kunai con papel bomba.
    /// Se mueve en línea recta, tiene su propio hitbox, y al impactar aplica daño + SFX.
    /// </summary>
    [RequireComponent(typeof(Rigidbody2D))]
    [RequireComponent(typeof(BoxCollider2D))]
    public class Projectile : MonoBehaviour, IPoolable
    {
        public Player.FighterController owner;
        public Player.FighterController target;
        public MoveData move;
        public int facing = 1;
        public float speed = 10f;
        public float maxLifetime = 3f;
        public float lifeTimer = 0f;
        public bool hasHit = false;
        public GameObject impactVFX;

        private Rigidbody2D rb;
        private BoxCollider2D box;

        private void Awake()
        {
            rb = GetComponent<Rigidbody2D>();
            box = GetComponent<BoxCollider2D>();
            rb.bodyType = RigidbodyType2D.Kinematic;
            rb.gravityScale = 0f;
            box.isTrigger = true;
        }

        public void Initialize(Player.FighterController o, Player.FighterController t, MoveData m, int dir)
        {
            owner = o;
            target = t;
            move = m;
            facing = dir;
            speed = move != null && move.attackerVelocity.magnitude > 0 ? move.attackerVelocity.magnitude : 10f;
            lifeTimer = 0f;
            hasHit = false;
            gameObject.SetActive(true);
            rb.linearVelocity = new Vector2(facing * speed, 0f);
        }

        public void TravelTo(Vector3 targetPos, float travelSpeed, float duration)
        {
            StartCoroutine(TravelRoutine(targetPos, travelSpeed, duration));
        }

        private System.Collections.IEnumerator TravelRoutine(Vector3 target, float speed, float duration)
        {
            float t = 0f;
            Vector3 start = transform.position;
            while (t < duration)
            {
                t += Time.deltaTime;
                transform.position = Vector3.Lerp(start, target, t / duration);
                yield return null;
            }
            Impact();
        }

        private void Update()
        {
            if (!gameObject.activeSelf) return;
            lifeTimer += Time.deltaTime;
            if (lifeTimer > maxLifetime) Despawn();
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (hasHit) return;
            var hurt = other.GetComponent<Combat.Hurtbox>();
            if (hurt == null || hurt.owner == null) return;
            if (hurt.owner == owner) return;
            if (owner != null && hurt.owner == owner.opponent)
            {
                Impact();
            }
        }

        private void Impact()
        {
            hasHit = true;
            if (move != null)
            {
                if (move.vfxOnImpact != null) VFXManager.Instance.SpawnHitImpact(transform.position);
                if (move.sfxOnImpact != null) Audio.AudioManager.PlaySFX(move.sfxOnImpact);
            }
            if (TimeManager.Instance != null) TimeManager.Instance.Freeze(0.08f);
            Despawn();
        }

        public void OnSpawned() { hasHit = false; lifeTimer = 0f; }
        public void OnDespawned() { rb.linearVelocity = Vector2.zero; }

        public void Despawn()
        {
            if (ObjectPool.Instance != null) ObjectPool.Instance.Despawn(gameObject);
            else gameObject.SetActive(false);
        }
    }
}
