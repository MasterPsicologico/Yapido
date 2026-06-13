namespace NarutoClash.AI
{
    public class AIStateMachine
    {
        public IAIState current;
        public float stateTime;

        public void ChangeState(IAIState next, Player.FighterController f)
        {
            if (current != null) current.Exit(f);
            current = next;
            stateTime = 0f;
            if (current != null) current.Enter(f);
        }

        public void Tick(Player.FighterController f, float dt)
        {
            stateTime += dt;
            if (current != null) current.Tick(f, dt);
        }

        public void CheckTransitions(Player.FighterController f)
        {
            if (current == null) return;
            var next = current.CheckTransition(f);
            if (next != null) ChangeState(next, f);
        }
    }
}
