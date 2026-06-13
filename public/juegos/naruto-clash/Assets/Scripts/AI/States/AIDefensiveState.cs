using UnityEngine;

namespace NarutoClash.AI.States
{
    public class AIDefensiveState : IAIState
    {
        public void Enter(Player.FighterController f)
        {
            if (AIController.Instance != null)
            {
                float dirX = f.opponent != null && f.opponent.transform.position.x > f.transform.position.x ? -1f : 1f;
                AIController.Instance.currentAxis = new Vector2(dirX * 0.4f, 0.5f);
            }
        }

        public void Exit(Player.FighterController f) { }

        public void Tick(Player.FighterController f, float dt)
        {
            if (AIController.Instance == null || f.opponent == null) return;
            float dirX = f.opponent.transform.position.x > f.transform.position.x ? -1f : 1f;
            AIController.Instance.currentAxis = new Vector2(dirX * 0.6f, 0f);
            AIController.Instance.wantsChakra = false;
        }

        public IAIState CheckTransition(Player.FighterController f)
        {
            if (AIController.Instance == null) return null;
            if (!AIController.Instance.ctx.opponentAttacking)
            {
                AIController.Instance.Decide();
                return null;
            }
            if (AIController.Instance.fsm.stateTime > 1.2f) return new AIIdleState();
            return null;
        }
    }
}
