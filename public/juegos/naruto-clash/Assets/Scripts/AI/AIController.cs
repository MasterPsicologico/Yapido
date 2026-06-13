using System.Collections.Generic;
using UnityEngine;
using NarutoClash.ScriptableObjects;

namespace NarutoClash.AI
{
    public interface IAIState
    {
        void Enter(Player.FighterController f);
        void Tick(Player.FighterController f, float dt);
        void Exit(Player.FighterController f);
        IAIState CheckTransition(Player.FighterController f);
    }

    public class AIContext
    {
        public float distanceToOpponent;
        public bool opponentAttacking;
        public bool opponentRecovering;
        public bool opponentJumping;
        public float selfHealthPct;
        public float opponentHealthPct;
        public float randomRoll;
        public float timeInState;
        public float reactionDelay;
    }

    /// <summary>
    /// Cerebro de la IA. Decide en cada frame a qué estado transicionar.
    /// </summary>
    public class AIController : MonoBehaviour
    {
        public Player.FighterController fighter;
        public AIStateMachine fsm;

        [Header("Tunables (overrides FighterData)")]
        [Range(0, 1)] public float blockChance = 0.5f;
        [Range(0, 1)] public float aggression = 0.6f;
        [Range(0, 1)] public float rangedChance = 0.3f;
        [Range(0, 1)] public float comboChance = 0.4f;
        [Range(0, 1)] public float desperationChance = 0.4f;
        [Min(0)] public float reactionTime = 0.15f;

        [Header("Ranges")]
        public float meleeRange = 1.8f;
        public float closeRange = 3.0f;
        public float midRange = 5.5f;
        public float farRange = 9f;

        [Header("Decision Tick")]
        public float decisionInterval = 0.1f;
        private float decisionTimer = 0f;
        private float nextDecisionAt = 0f;

        [System.NonSerialized] public AIContext ctx = new AIContext();
        [System.NonSerialized] public Vector2 currentAxis = Vector2.zero;
        [System.NonSerialized] public bool wantsLightPunch;
        [System.NonSerialized] public bool wantsHeavyPunch;
        [System.NonSerialized] public bool wantsChakra;
        [System.NonSerialized] public bool wantsSubstitution;
        [System.NonSerialized] public bool wantsAwakening;

        public static AIController Instance { get; private set; }

        private void Awake()
        {
            Instance = this;
            fsm = new AIStateMachine();
            if (fighter == null) fighter = GetComponent<Player.FighterController>();
            fsm.ChangeState(new States.AIIdleState(), fighter);
        }

        public static Vector2 GetAxis(Player.FighterController f)
        {
            if (f == null || !f.IsAI) return Vector2.zero;
            var ctrl = Instance;
            if (ctrl == null) return Vector2.zero;
            return ctrl.currentAxis;
        }

        private void Update()
        {
            if (fighter == null || fighter.opponent == null) return;
            UpdateContext();
            fsm.Tick(fighter, Time.deltaTime);
            fsm.CheckTransitions(fighter);
        }

        private void UpdateContext()
        {
            ctx.distanceToOpponent = Vector2.Distance(fighter.transform.position, fighter.opponent.transform.position);
            ctx.opponentAttacking = fighter.opponent.CurrentState == Player.FighterController.FighterState.Attacking
                                    || fighter.opponent.CurrentState == Player.FighterController.FighterState.SpecialAttacking;
            ctx.opponentRecovering = fighter.opponent.CurrentState == Player.FighterController.FighterState.Attacking;
            ctx.opponentJumping = fighter.opponent.CurrentState == Player.FighterController.FighterState.Jumping;
            ctx.selfHealthPct = fighter.Data != null ? fighter.currentHealth / fighter.Data.maxHealth : 1f;
            ctx.opponentHealthPct = fighter.opponent.Data != null ? fighter.opponent.currentHealth / fighter.opponent.Data.maxHealth : 1f;
            ctx.timeInState += Time.deltaTime;
        }

        public void Decide()
        {
            if (fighter.Data == null) return;
            blockChance = fighter.Data.aiBlockChance;
            aggression = fighter.Data.aiAggression;
            rangedChance = fighter.Data.aiRangedChance;
            comboChance = fighter.Data.aiComboChance;
            reactionTime = fighter.Data.aiReactionTime;

            ctx.randomRoll = Random.value;

            if (ctx.opponentAttacking && ctx.randomRoll < blockChance)
            {
                fsm.ChangeState(new States.AIDefensiveState(), fighter);
                return;
            }

            if (ctx.selfHealthPct < 0.3f && ctx.randomRoll < desperationChance && fighter.awakening != null && fighter.awakening.CanAwaken())
            {
                fsm.ChangeState(new States.AIAwakeningState(), fighter);
                return;
            }

            if (ctx.distanceToOpponent > midRange && ctx.randomRoll < rangedChance)
            {
                fsm.ChangeState(new States.AIRangedState(), fighter);
                return;
            }

            if (ctx.distanceToOpponent > meleeRange)
            {
                fsm.ChangeState(new States.AIApproachState(), fighter);
                return;
            }

            if (ctx.distanceToOpponent <= meleeRange)
            {
                if (ctx.opponentRecovering && ctx.randomRoll < comboChance)
                {
                    fsm.ChangeState(new States.AIComboState(), fighter);
                }
                else
                {
                    fsm.ChangeState(new States.AIAttackState(), fighter);
                }
                return;
            }

            fsm.ChangeState(new States.AIIdleState(), fighter);
        }
    }
}
