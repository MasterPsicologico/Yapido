using UnityEngine;

namespace NarutoClash.AI.States
{
    public class AIAwakeningState : IAIState
    {
        public void Enter(Player.FighterController f) { }
        public void Exit(Player.FighterController f) { }

        public void Tick(Player.FighterController f, float dt)
        {
            if (AIController.Instance == null) return;
            AIController.Instance.wantsAwakening = true;
        }

        public IAIState CheckTransition(Player.FighterController f)
        {
            if (AIController.Instance == null) return null;
            if (f.isAwakened)
            {
                AIController.Instance.Decide();
                return null;
            }
            if (AIController.Instance.fsm.stateTime > 1.5f) return new AIIdleState();
            return null;
        }
    }
}
