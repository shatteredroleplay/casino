import { config, title } from './config'
import { fit } from './fit'

export default function Plate() {
  return (
    <div class="plate">
      <div class="lights top" />
      <h1 ref={fit(940)}>{title}</h1>
      <p ref={fit(960)}>{config.tag}</p>
      <div class="lights bottom" />
    </div>
  )
}
