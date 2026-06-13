using UnityEngine;

namespace NarutoClash.ScriptableObjects
{
    [CreateAssetMenu(fileName = "NewComboData", menuName = "NarutoClash/Combo Data", order = 2)]
    public class ComboData : ScriptableObject
    {
        public string comboId = "naruto_basic";
        public string displayName = "Basic 3-Hit";

        [Tooltip("Secuencia de MoveData. Cada uno se ejecuta tras cancelar el anterior.")]
        public MoveData[] sequence;

        [Tooltip("Ventana en frames DESPUÉS de que el move conecta (hit) para iniciar el siguiente.")]
        public int[] hitWindowFrames;

        [Tooltip("Ventana en frames DESPUÉS de que el move es bloqueado para iniciar el siguiente.")]
        public int[] blockWindowFrames;

        [Min(0)] public int totalChakraCost = 0;
        public bool requiresAwakening = false;

        public int Length => sequence != null ? sequence.Length : 0;

        public int GetHitWindow(int moveIndex)
        {
            if (hitWindowFrames == null || moveIndex >= hitWindowFrames.Length) return 12;
            return hitWindowFrames[moveIndex];
        }

        public int GetBlockWindow(int moveIndex)
        {
            if (blockWindowFrames == null || moveIndex >= blockWindowFrames.Length) return 6;
            return blockWindowFrames[moveIndex];
        }
    }
}
