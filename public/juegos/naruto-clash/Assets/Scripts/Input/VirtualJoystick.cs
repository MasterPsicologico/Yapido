using UnityEngine;
using UnityEngine.EventSystems;

namespace NarutoClash.Input
{
    /// <summary>
    /// Joystick analógico virtual para móvil. Se arrastra con el dedo y
    /// devuelve un Vector2 (-1 a 1 por eje). Flota donde el usuario lo coloca.
    /// </summary>
    public class VirtualJoystick : MonoBehaviour, IPointerDownHandler, IDragHandler, IPointerUpHandler
    {
        public RectTransform background;
        public RectTransform handle;
        public float handleRange = 60f;
        public float deadZone = 0.18f;

        [System.NonSerialized] public Vector2 Axis = Vector2.zero;
        [System.NonSerialized] public InputEventType LastDirection = InputEventType.JoystickNeutral;
        [System.NonSerialized] public bool IsActive = false;

        public delegate void DirectionEvent(InputEventType dir);
        public event DirectionEvent OnDirectionChanged;

        private Canvas canvas;
        private Camera cam;

        private void Awake()
        {
            canvas = GetComponentInParent<Canvas>();
            if (canvas != null && canvas.renderMode == RenderMode.ScreenSpaceCamera) cam = canvas.worldCamera;
            if (handle != null) handle.anchoredPosition = Vector2.zero;
        }

        public void OnPointerDown(PointerEventData eventData)
        {
            IsActive = true;
            OnDrag(eventData);
        }

        public void OnDrag(PointerEventData eventData)
        {
            if (background == null) return;
            Vector2 pos;
            RectTransformUtility.ScreenPointToLocalPointInRectangle(background, eventData.position, cam, out pos);

            pos /= background.sizeDelta * 0.5f;
            Axis = new Vector2(pos.x, pos.y);
            if (Axis.magnitude < deadZone) Axis = Vector2.zero;
            Axis = Vector2.ClampMagnitude(Axis, 1f);

            if (handle != null)
            {
                handle.anchoredPosition = Axis * handleRange;
            }

            InputEventType dir = QuantizeDirection(Axis);
            if (dir != LastDirection)
            {
                LastDirection = dir;
                OnDirectionChanged?.Invoke(dir);
            }
        }

        public void OnPointerUp(PointerEventData eventData)
        {
            IsActive = false;
            Axis = Vector2.zero;
            if (handle != null) handle.anchoredPosition = Vector2.zero;
            if (LastDirection != InputEventType.JoystickNeutral)
            {
                LastDirection = InputEventType.JoystickNeutral;
                OnDirectionChanged?.Invoke(InputEventType.JoystickNeutral);
            }
        }

        public static InputEventType QuantizeDirection(Vector2 axis)
        {
            if (axis.sqrMagnitude < 0.04f) return InputEventType.JoystickNeutral;
            float ax = Mathf.Abs(axis.x);
            float ay = Mathf.Abs(axis.y);
            const float diagRatio = 0.55f;

            if (ax > diagRatio && ay <= diagRatio) return axis.x > 0 ? InputEventType.JoystickRight : InputEventType.JoystickLeft;
            if (ay > diagRatio && ax <= diagRatio) return axis.y > 0 ? InputEventType.JoystickUp : InputEventType.JoystickDown;
            if (axis.x > 0 && axis.y > 0) return InputEventType.JoystickUpRight;
            if (axis.x < 0 && axis.y > 0) return InputEventType.JoystickUpLeft;
            if (axis.x > 0 && axis.y < 0) return InputEventType.JoystickDownRight;
            if (axis.x < 0 && axis.y < 0) return InputEventType.JoystickDownLeft;
            return InputEventType.JoystickNeutral;
        }
    }
}
