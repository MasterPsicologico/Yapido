using UnityEngine;
using NarutoClash.ScriptableObjects;
using NarutoClash.Input;
using NarutoClash.Combat;

namespace NarutoClash.Player
{
    /// <summary>
    /// Script base del luchador. Controla movimiento, estados, combate,
    /// recursos (chakra, sustitución, despertar) y facing direction.
    /// Es agnóstico al personaje — toda la diferencia está en el FighterData
    /// asignado y en los sprites/animaciones.
    /// </summary>
    [RequireComponent(typeof(Rigidbody2D))]
    [RequireComponent(typeof(BoxCollider2D))]
    public class FighterController : MonoBehaviour
    {
        public enum FighterState
        {
            Idle,
            Walking,
            Jumping,
            Crouching,
            Attacking,
            SpecialAttacking,
            Awakening,
            Hit,
            Blockstun,
            Blocking,
            Knockdown,
            Wakeup,
            Substitution,
            KO,
            Intros
        }

        [Header("Data")]
        public FighterData Data;
        public bool IsAI = false;

        [Header("Runtime Stats")]
        public float currentHealth;
        public float currentChakra;
        public int substitutionCharges;
        public int awakeningMeter;
        public bool isAwakened = false;

        [Header("References")]
        public FighterController opponent;
        public Animator animator;
        public MobileInputManager inputManager;
        public Chakra.ChakraSystem chakra;
        public Substitution.SubstitutionSystem substitution;
        public Awakening.AwakeningSystem awakening;

        [Header("Combat")]
        public Hitbox[] allHitboxes;
        public Hurtbox[] allHurtboxes;
        public Hitbox currentHitbox;
        public MoveData currentMove;
        public int currentMoveFrame;

        [Header("Physics")]
        public LayerMask groundLayer;
        public Transform groundCheck;
        public float groundCheckRadius = 0.15f;
        public bool isGrounded;
        public int jumpsRemaining;

        [Header("Direction")]
        public int facing = 1;

        [Header("State")]
        public FighterState CurrentState = FighterState.Idle;
        public int stateFrame = 0;
        public bool IsHoldingBlock = false;
        public bool IsInvulnerable = false;
        public bool IsKO => CurrentState == FighterState.KO;

        [Header("Input")]
        public InputBuffer buffer = new InputBuffer();
        public CommandReader commandReader = new CommandReader();

        private Rigidbody2D rb;
        private BoxCollider2D bodyCollider;
        private float hitstopRemaining = 0f;
        private float substituteWindowRemaining = 0f;
        private float wakeupTimer = 0f;
        private float walkAxisSmoothed = 0f;

        public void Awake()
        {
            rb = GetComponent<Rigidbody2D>();
            bodyCollider = GetComponent<BoxCollider2D>();
            rb.bodyType = RigidbodyType2D.Dynamic;
            rb.gravityScale = 3.5f;
            rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            rb.interpolation = RigidbodyInterpolation2D.Interpolate;
            rb.constraints = RigidbodyConstraints2D.FreezeRotation;

            if (Data != null)
            {
                currentHealth = Data.maxHealth;
                currentChakra = 0;
                substitutionCharges = Data.substitutionCharges;
                awakeningMeter = 0;
            }

            buffer.Configure(1f, 32);

            if (animator == null) animator = GetComponentInChildren<Animator>();
            if (animator != null && Data != null && Data.animatorController != null)
                animator.runtimeAnimatorController = Data.animatorController;

            InitResourceSystems();
            AutoAssignHitboxes();
        }

        private void InitResourceSystems()
        {
            if (Data == null) return;
            if (chakra == null) chakra = new Chakra.ChakraSystem(Data);
            else { chakra.max = Data.maxChakra; chakra.data = Data; }
            if (substitution == null) substitution = new Substitution.SubstitutionSystem(Data);
            else { substitution.maxCharges = Data.substitutionCharges; substitution.rechargeInterval = Data.substitutionRechargeTime; }
            if (awakening == null) awakening = new Awakening.AwakeningSystem(Data);
        }

        private void AutoAssignHitboxes()
        {
            if (allHitboxes == null || allHitboxes.Length == 0)
            {
                allHitboxes = GetComponentsInChildren<Hitbox>(true);
            }
            if (allHurtboxes == null || allHurtboxes.Length == 0)
            {
                allHurtboxes = GetComponentsInChildren<Hurtbox>(true);
            }
            for (int i = 0; i < allHitboxes.Length; i++)
            {
                if (allHitboxes[i] != null) allHitboxes[i].owner = this;
            }
            for (int i = 0; i < allHurtboxes.Length; i++)
            {
                if (allHurtboxes[i] != null) allHurtboxes[i].owner = this;
            }
            if (currentHitbox == null && allHitboxes != null && allHitboxes.Length > 0)
            {
                currentHitbox = allHitboxes[0];
            }
        }

        public void Start()
        {
            if (opponent != null) FaceOpponent();
        }

        public void FixedUpdate()
        {
            if (hitstopRemaining > 0)
            {
                hitstopRemaining -= Time.fixedDeltaTime;
                rb.linearVelocity = Vector2.zero;
                return;
            }

            CheckGround();
            ProcessStateMachine();
            ResolveFacing();
        }

        public void Update()
        {
            stateFrame++;
            if (Data == null) return;
            if (CurrentState == FighterState.KO) return;

            if (substituteWindowRemaining > 0) substituteWindowRemaining -= Time.deltaTime;
            if (wakeupTimer > 0) wakeupTimer -= Time.deltaTime;

            if (animator != null) animator.SetInteger("StateFrame", stateFrame);
        }

        public void SetState(FighterState newState)
        {
            if (CurrentState == newState) return;
            ExitState(CurrentState);
            CurrentState = newState;
            stateFrame = 0;
            EnterState(newState);
        }

        private void EnterState(FighterState s)
        {
            switch (s)
            {
                case FighterState.Idle:
                    if (animator != null) animator.SetTrigger("idle");
                    break;
                case FighterState.Walking:
                    if (animator != null) animator.SetTrigger("walk");
                    break;
                case FighterState.Crouching:
                    if (animator != null) animator.SetTrigger("crouch");
                    break;
                case FighterState.Jumping:
                    if (animator != null) animator.SetTrigger("jump");
                    break;
                case FighterState.Attacking:
                case FighterState.SpecialAttacking:
                    if (currentMove != null && animator != null && !string.IsNullOrEmpty(currentMove.animationTrigger))
                        animator.SetTrigger(currentMove.animationTrigger);
                    break;
                case FighterState.Hit:
                    if (animator != null) animator.SetTrigger("hit");
                    break;
                case FighterState.Blockstun:
                    if (animator != null) animator.SetTrigger("blockstun");
                    break;
                case FighterState.Blocking:
                    if (animator != null) animator.SetBool("blocking", true);
                    break;
                case FighterState.Knockdown:
                    if (animator != null) animator.SetTrigger("knockdown");
                    break;
                case FighterState.Wakeup:
                    if (animator != null) animator.SetTrigger("wakeup");
                    break;
                case FighterState.Substitution:
                    IsInvulnerable = true;
                    if (animator != null) animator.SetTrigger("substitution");
                    if (substitution != null) substitution.Execute(this, opponent);
                    break;
                case FighterState.Awakening:
                    isAwakened = true;
                    if (animator != null) animator.SetTrigger("awakening");
                    break;
                case FighterState.KO:
                    if (animator != null) animator.SetTrigger("ko");
                    IsInvulnerable = true;
                    if (rb != null) rb.linearVelocity = Vector2.zero;
                    if (Core.BattleManager.Instance != null) Core.BattleManager.Instance.OnFighterKO(this);
                    break;
            }
        }

        private void ExitState(FighterState s)
        {
            switch (s)
            {
                case FighterState.Blocking:
                    if (animator != null) animator.SetBool("blocking", false);
                    break;
                case FighterState.Attacking:
                case FighterState.SpecialAttacking:
                    ResetHitboxes();
                    currentMove = null;
                    currentMoveFrame = 0;
                    break;
                case FighterState.Substitution:
                    IsInvulnerable = false;
                    break;
            }
        }

        private void ProcessStateMachine()
        {
            switch (CurrentState)
            {
                case FighterState.Idle: UpdateIdle(); break;
                case FighterState.Walking: UpdateWalking(); break;
                case FighterState.Crouching: UpdateCrouch(); break;
                case FighterState.Jumping: UpdateJumping(); break;
                case FighterState.Attacking: UpdateAttacking(); break;
                case FighterState.SpecialAttacking: UpdateAttacking(); break;
                case FighterState.Hit: UpdateHit(); break;
                case FighterState.Blockstun: UpdateBlockstun(); break;
                case FighterState.Blocking: UpdateBlocking(); break;
                case FighterState.Knockdown: UpdateKnockdown(); break;
                case FighterState.Wakeup: UpdateWakeup(); break;
                case FighterState.Substitution: UpdateSubstitution(); break;
                case FighterState.Awakening: UpdateAttacking(); break;
            }
        }

        private void UpdateIdle()
        {
            if (!isGrounded) { SetState(FighterState.Jumping); return; }
            Vector2 axis = ReadMoveAxis();
            if (axis.y < -0.5f) { SetState(FighterState.Crouching); return; }
            if (Mathf.Abs(axis.x) > 0.2f) { SetState(FighterState.Walking); return; }
            if (TryReadAttackInput()) return;
            if (TryReadSpecialInput()) return;
            if (TryReadAwakeningInput()) return;
            if (TryReadJumpInput()) return;
            rb.linearVelocity = new Vector2(0, rb.linearVelocity.y);
        }

        private void UpdateWalking()
        {
            if (!isGrounded) { SetState(FighterState.Jumping); return; }
            Vector2 axis = ReadMoveAxis();
            if (axis.y < -0.5f) { SetState(FighterState.Crouching); return; }
            if (Mathf.Abs(axis.x) <= 0.2f) { SetState(FighterState.Idle); return; }
            float target = axis.x * Data.walkSpeed;
            walkAxisSmoothed = Mathf.Lerp(walkAxisSmoothed, target, 0.3f);
            rb.linearVelocity = new Vector2(walkAxisSmoothed, rb.linearVelocity.y);
            if (TryReadAttackInput()) return;
            if (TryReadSpecialInput()) return;
        }

        private void UpdateCrouch()
        {
            Vector2 axis = ReadMoveAxis();
            if (axis.y > -0.5f) { SetState(FighterState.Idle); return; }
            rb.linearVelocity = new Vector2(0, rb.linearVelocity.y);
            if (TryReadAttackInput()) return;
        }

        private void UpdateJumping()
        {
            Vector2 axis = ReadMoveAxis();
            rb.linearVelocity = new Vector2(axis.x * Data.walkSpeed * Data.airControl, rb.linearVelocity.y);
            if (isGrounded && rb.linearVelocity.y <= 0.01f) { jumpsRemaining = Data.maxJumps; SetState(FighterState.Idle); }
            if (TryReadAttackInput()) return;
        }

        private void UpdateAttacking()
        {
            currentMoveFrame++;
            int local = currentMoveFrame - 1;
            if (local >= 0 && local < currentMove.startupFrames)
            {
                rb.linearVelocity = new Vector2(0, rb.linearVelocity.y);
            }
            else if (local >= currentMove.startupFrames && local < currentMove.startupFrames + currentMove.activeFrames)
            {
                int activeLocal = local - currentMove.startupFrames;
                HitboxFrame hf = currentMove.GetActiveFrame(activeLocal);
                if (hf != null) ActivateHitboxFrame(hf, currentMove);
                rb.linearVelocity = new Vector2(currentMove.attackerVelocity.x * facing, currentMove.attackerVelocity.y);
            }
            else if (local >= currentMove.startupFrames + currentMove.activeFrames)
            {
                if (local >= currentMove.TotalFrames)
                {
                    SetState(FighterState.Idle);
                    return;
                }
            }
            TryReadCancel();
        }

        private void UpdateHit()
        {
            if (stateFrame >= 12) SetState(FighterState.Idle);
        }

        private void UpdateBlockstun()
        {
            if (stateFrame >= 8) SetState(FighterState.Idle);
        }

        private void UpdateBlocking()
        {
            Vector2 axis = ReadMoveAxis();
            if (Mathf.Abs(axis.x) > 0.2f) { SetState(FighterState.Walking); return; }
            if (axis.y < -0.5f) { SetState(FighterState.Crouching); return; }
            IsHoldingBlock = IsBackHeld();
            if (!IsHoldingBlock) SetState(FighterState.Idle);
            rb.linearVelocity = new Vector2(0, rb.linearVelocity.y);
        }

        private void UpdateKnockdown()
        {
            if (isGrounded && rb.linearVelocity.y <= 0.01f)
            {
                wakeupTimer = 30f / 60f;
                SetState(FighterState.Wakeup);
            }
        }

        private void UpdateWakeup()
        {
            if (wakeupTimer <= 0) SetState(FighterState.Idle);
        }

        private void UpdateSubstitution()
        {
            if (stateFrame >= 12) SetState(FighterState.Idle);
        }

        public void ApplyDamage(float amount, float hitstun, bool launch, bool hardKD, int hitstop, float pushback, Vector2 hitSource)
        {
            currentHealth = Mathf.Max(0, currentHealth - amount);
            if (currentHealth <= 0) { SetState(FighterState.KO); return; }

            if (hardKD) SetState(FighterState.Knockdown);
            else SetState(FighterState.Hit);

            if (hitstop > 0) hitstopRemaining = hitstop / 60f;

            Vector2 push = new Vector2(-Mathf.Sign(transform.position.x - hitSource.x) * pushback, launch ? 8f : 0f);
            rb.linearVelocity = push;

            if (awakening != null) awakening.Gain(Data.awakeningPerHitReceived);
        }

        public void ApplyChipDamage(int amount) => currentHealth = Mathf.Max(0, currentHealth - amount);

        public void ApplyBlockstun(int stun, float pushback, Vector2 hitSource)
        {
            SetState(FighterState.Blockstun);
            Vector2 push = new Vector2(-Mathf.Sign(transform.position.x - hitSource.x) * pushback, 0);
            rb.linearVelocity = push;
        }

        public void OnHitConnected(int damageDealt)
        {
            if (chakra != null) chakra.Gain(Data.chakraPerHitLanded);
            if (awakening != null) awakening.Gain(Data.awakeningPerComboHit);
        }

        public void OnAttackLanded(Hitbox hit, FighterController defender, bool blocked)
        {
            if (defender == null) return;
        }

        public void CheckGround()
        {
            if (groundCheck == null) { isGrounded = true; return; }
            isGrounded = Physics2D.OverlapCircle(groundCheck.position, groundCheckRadius, groundLayer);
        }

        public void ResolveFacing()
        {
            if (opponent == null) return;
            if (CurrentState == FighterState.Hit || CurrentState == FighterState.Knockdown) return;
            int want = opponent.transform.position.x > transform.position.x ? 1 : -1;
            if (want != facing)
            {
                facing = want;
                Vector3 s = transform.localScale;
                s.x = Mathf.Abs(s.x) * facing * Data.spriteScale.x;
                transform.localScale = s;
            }
        }

        public void FaceOpponent()
        {
            if (opponent == null) return;
            facing = opponent.transform.position.x > transform.position.x ? 1 : -1;
            Vector3 s = transform.localScale;
            s.x = Mathf.Abs(s.x) * facing;
            transform.localScale = s;
        }

        private Vector2 ReadMoveAxis()
        {
            if (IsAI) return AI.AIController.GetAxis(this);
            if (inputManager == null || inputManager.joystick == null) return Vector2.zero;
            return inputManager.joystick.Axis;
        }

        private bool TryReadJumpInput()
        {
            if (inputManager == null) return false;
            if (inputManager.joystick == null) return false;
            return inputManager.joystick.LastDirection == InputEventType.JoystickUp && isGrounded && jumpsRemaining > 0;
        }

        private bool TryReadAttackInput()
        {
            if (inputManager == null) return false;
            float now = Time.time;
            if (buffer.ContainsRecent(InputEventType.LightPunch_Press, 0.1f, now))
            {
                BeginMove(Data.GetMove(MoveData.InputCommand.LightPunch));
                return true;
            }
            if (buffer.ContainsRecent(InputEventType.HeavyPunch_Press, 0.1f, now))
            {
                BeginMove(Data.GetMove(MoveData.InputCommand.HeavyPunch));
                return true;
            }
            return false;
        }

        private bool TryReadSpecialInput()
        {
            float now = Time.time;
            MoveData m = commandReader.TryReadSpecial(
                buffer, now, Data, currentMove, currentMoveFrame,
                CurrentState == FighterState.Attacking || CurrentState == FighterState.SpecialAttacking,
                CurrentState == FighterState.Attacking || CurrentState == FighterState.SpecialAttacking,
                facing);
            if (m != null && chakra != null && chakra.TryConsume(m.chakraCost))
            {
                BeginMove(m);
                return true;
            }
            return false;
        }

        private bool TryReadAwakeningInput()
        {
            if (awakening == null || !awakening.CanAwaken()) return false;
            float now = Time.time;
            MoveData m = commandReader.TryReadAwakening(buffer, now, Data, facing);
            if (m != null)
            {
                awakening.Activate();
                BeginMove(m);
                return true;
            }
            return false;
        }

        private void TryReadCancel()
        {
            if (currentMove == null) return;
            if (currentMoveFrame < currentMove.cancelWindowStart || currentMoveFrame > currentMove.cancelWindowEnd) return;
            TryReadSpecialInput();
        }

        private bool IsBackHeld()
        {
            if (inputManager == null || inputManager.joystick == null) return false;
            Vector2 axis = inputManager.joystick.Axis;
            return (facing > 0 && axis.x < -0.5f) || (facing < 0 && axis.x > 0.5f);
        }

        public void BeginMove(MoveData m)
        {
            if (m == null) return;
            if (Data == null) return;

            if (m.attackType == AttackType.Projectile) { SpawnProjectile(m); SetState(FighterState.Idle); return; }

            currentMove = m;
            currentMoveFrame = 0;
            SetState(m.isSpecial ? FighterState.SpecialAttacking : FighterState.Attacking);
        }

        private void SpawnProjectile(MoveData m)
        {
            if (m.vfxOnActivation == null) return;
            Vector3 pos = transform.position + new Vector3(facing * 1.5f, 1.0f, 0f);
            GameObject go = Instantiate(m.vfxOnActivation, pos, Quaternion.identity);
            Projectiles.Projectile p = go.GetComponent<Projectiles.Projectile>();
            if (p != null) p.Initialize(this, opponent, m, facing);
        }

        public void ActivateHitboxFrame(HitboxFrame hf, MoveData move)
        {
            if (currentHitbox == null) return;
            currentHitbox.transform.localPosition = hf.localOffset;
            currentHitbox.GetComponent<BoxCollider2D>().size = hf.size;
            currentHitbox.Activate(
                move.damage, move.hitstun, move.blockstun, move.hitstopFrames, move.chipDamagePercent,
                move.pushbackOnHit, move.pushbackOnBlock, move.launchesOnHit, move.hardKnockdown);
        }

        public void ResetHitboxes()
        {
            if (allHitboxes == null) return;
            for (int i = 0; i < allHitboxes.Length; i++)
            {
                if (allHitboxes[i] != null) allHitboxes[i].Deactivate();
            }
        }
    }
}
