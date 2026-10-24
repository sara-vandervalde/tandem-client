import { colorFor } from '../utils/colors'

type AvatarProps = { name: string; size?: number }

// A round avatar with the first letter of the name
export default function Avatar({ name, size = 32 }: AvatarProps) {
  return (
    <span
      className="avatar"
      title={name}
      style={{ background: colorFor(name), width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.trim().charAt(0)}
    </span>
  )
}
