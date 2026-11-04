// Horse and jockey drawing shared by the race screen and the betting pages.
// Local space: the horse faces right, hooves on y = 0, about 260 units long and 190 tall.
const Horse = (() => {
    const TAU = Math.PI * 2
    // coat, mane and tail, dark lower legs
    const COATS = [
        ['#7a4524', '#1d120b', true], ['#9a5a26', '#3a1d0c', false], ['#332925', '#0e0a08', false],
        ['#bdb8b0', '#5f5a54', false], ['#c9a063', '#f1e3c4', false], ['#5a331b', '#140c07', true],
    ]
    const HOOF = '#17110d', SKIN = '#e3b48c', LINE = 'rgba(20,12,6,.45)'
    const STANCE = .27

    const shade = (hex, k) => {
        const n = parseInt(hex.slice(1), 16)
        const f = v => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))
        return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`
    }

    // tapered segment with rounded ends
    const limb = (g, x1, y1, w1, x2, y2, w2, fill) => {
        const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a), ny = Math.cos(a), q = Math.PI / 2
        g.fillStyle = fill
        g.beginPath()
        g.moveTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2)
        g.lineTo(x2 + nx * w2 / 2, y2 + ny * w2 / 2)
        g.arc(x2, y2, w2 / 2, a + q, a - q, true)
        g.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2)
        g.arc(x1, y1, w1 / 2, a - q, a + q, true)
        g.closePath()
        g.fill()
    }

    // two-bone reach from a joint to a hoof position; dir picks which way the middle joint bends
    const reach = (jx, jy, tx, ty, l1, l2, dir) => {
        let dx = tx - jx, dy = ty - jy, d = Math.hypot(dx, dy)
        const max = l1 + l2 - .5
        if (d > max) {
            tx = jx + dx / d * max
            ty = jy + dy / d * max
            d = max
        }
        const bend = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))))
        const a = Math.atan2(ty - jy, tx - jx) + dir * bend
        return [jx + Math.cos(a) * l1, jy + Math.sin(a) * l1, tx, ty]
    }

    // p = this leg's place in the stride (0 = hoof lands), or null when standing.
    // The hoof stays planted on the ground through the stance and is tucked up through the swing.
    const leg = (g, front, jx, jy, p, upper, lower, sock) => {
        const ahead = front ? 44 : 54, behind = front ? 50 : 56, lift = front ? 50 : 36
        // a standing horse keeps its legs nearly straight
        const size = p === null ? .93 : 1
        const l1 = (front ? 46 : 52) * size, l2 = (front ? 46 : 50) * size
        let tx, ty, planted = 1
        if (p === null) {
            tx = jx + (front ? 2 : 8)
            ty = -5
        } else if (p < STANCE) {
            tx = jx + ahead - (ahead + behind) * p / STANCE
            ty = -5
        } else {
            const u = (p - STANCE) / (1 - STANCE), e = u * u * (3 - 2 * u)
            tx = jx - behind + (ahead + behind) * e
            ty = -5 - lift * Math.sin(Math.PI * u) ** .9
            planted = 0
        }
        const [kx, ky, fx, fy] = reach(jx, jy, tx, ty, l1, l2, front ? -1 : 1)
        // fetlock, a little above the hoof and set back so the pastern slopes
        const px = kx + (fx - kx) * .78 - 3 * planted, py = ky + (fy - ky) * .78
        limb(g, jx, jy, front ? 21 : 31, kx, ky, front ? 12.5 : 13.5, upper)
        g.beginPath(); g.arc(kx, ky, front ? 7 : 7.5, 0, TAU); g.fill()
        limb(g, kx, ky, front ? 11 : 12, px, py, 7.5, lower)
        g.beginPath(); g.arc(px, py, 4.8, 0, TAU); g.fill()
        limb(g, px, py, 7.5, fx, fy, 8.5, sock ? '#ecebe6' : lower)
        const tilt = planted ? 0 : (px - fx) * .25
        g.fillStyle = HOOF
        g.beginPath()
        g.moveTo(fx - 6, fy - 2 - tilt * .3); g.lineTo(fx + 5, fy - 3); g.lineTo(fx + 8, fy + 5); g.lineTo(fx - 7, fy + 5 - tilt * .3)
        g.closePath()
        g.fill()
    }

    // look = { coat: COATS entry, color, trim, number }, ph = stride phase in radians or null for a standing horse
    const draw = (g, x, y, s, look, ph) => {
        const [coat, hair, points] = look.coat
        const run = ph !== null
        const t = run ? ((ph / TAU) % 1 + 1) % 1 : 0
        const at = o => run ? ((t - o) % 1 + 1) % 1 : null
        const wave = run ? Math.sin(TAU * t * 2) : 0
        const blaze = look.number % 3 === 1, socks = look.number % 2 === 0
        const lowNear = points ? shade(coat, -.72) : shade(coat, -.18), lowFar = points ? shade(coat, -.8) : shade(coat, -.48)

        // the body sinks as the forelegs land and floats in the suspension, and it rocks nose-down with it
        const drop = run ? 7 - 6 * Math.cos(TAU * (t - .85)) : 0
        const pitch = run ? .04 * Math.sin(TAU * (t - .12)) : 0
        const cs = Math.cos(pitch), sn = Math.sin(pitch)
        const joint = (jx, jy) => [jx * cs - (jy + 100) * sn, -100 + jx * sn + (jy + 100) * cs + drop]

        g.save()
        g.translate(x, y)
        g.scale(s, s)
        g.lineJoin = 'round'
        g.lineCap = 'round'

        const air = run ? Math.max(0, Math.cos(TAU * (t - .85))) : 0
        g.fillStyle = `rgba(0,0,0,${.24 - .08 * air})`
        g.beginPath(); g.ellipse(6, 3, 104 - 10 * air, 9 - 2 * air, 0, 0, TAU); g.fill()

        // far legs
        leg(g, false, ...joint(-44, -94), at(0), shade(coat, -.42), lowFar, false)
        leg(g, true, ...joint(42, -90), at(.32), shade(coat, -.42), lowFar, false)

        g.save()
        g.translate(0, drop - 100)
        g.rotate(pitch)
        g.translate(0, 100)

        // tail, three overlapping locks
        g.fillStyle = hair
        for (const [dy, len] of [[0, 1], [6, .86], [-5, .72]]) {
            g.beginPath()
            if (run) {
                g.moveTo(-80, -128)
                g.bezierCurveTo(-104, -140 + dy, -134 * len, -134 + dy + wave * 5, -168 * len, -108 + dy + wave * 10)
                g.bezierCurveTo(-140 * len, -112 + dy + wave * 6, -112, -110 + dy, -82, -106)
            } else {
                g.moveTo(-80, -128)
                g.bezierCurveTo(-102, -126, -108 - dy, -90, -100 - dy, -40 - dy * 2)
                g.bezierCurveTo(-92, -70, -88, -96, -82, -106)
            }
            g.closePath()
            g.fill()
        }

        // body
        const body = g.createLinearGradient(0, -136, 0, -60)
        body.addColorStop(0, shade(coat, .2))
        body.addColorStop(.4, coat)
        body.addColorStop(1, shade(coat, -.42))
        g.fillStyle = body
        g.beginPath()
        g.moveTo(40, -130)
        g.bezierCurveTo(22, -126, 0, -121, -22, -123)
        g.bezierCurveTo(-40, -125, -58, -135, -70, -131)
        g.bezierCurveTo(-87, -127, -93, -110, -89, -94)
        g.bezierCurveTo(-87, -82, -77, -73, -62, -73)
        g.bezierCurveTo(-46, -67, -30, -65, -14, -63)
        g.bezierCurveTo(6, -59, 26, -59, 40, -65)
        g.bezierCurveTo(57, -70, 71, -84, 73, -100)
        g.bezierCurveTo(74, -114, 60, -126, 40, -130)
        g.closePath()
        g.fill()
        g.strokeStyle = LINE
        g.lineWidth = 1.3
        g.stroke()
        // muscle highlights on the haunch and shoulder
        for (const [hx, hy, rx, ry] of [[-60, -106, 26, 22], [48, -102, 20, 24]]) {
            const glow = g.createRadialGradient(hx, hy - 6, 2, hx, hy, rx)
            glow.addColorStop(0, shade(coat, .34))
            glow.addColorStop(1, shade(coat, .34).replace('rgb', 'rgba').replace(')', ',0)'))
            g.fillStyle = glow
            g.globalAlpha = .55
            g.beginPath(); g.ellipse(hx, hy, rx, ry, 0, 0, TAU); g.fill()
            g.globalAlpha = 1
        }
        // girth
        g.strokeStyle = '#231a14'
        g.lineWidth = 3.5
        g.beginPath(); g.moveTo(20, -127); g.quadraticCurveTo(30, -94, 26, -62); g.stroke()

        // neck and head stretch forward as the forelegs land
        const nod = run ? .09 * Math.sin(TAU * (t - .15)) : -.3
        g.save()
        g.translate(34, -124)
        g.rotate(nod)
        g.translate(-34, 124)
        const neck = g.createLinearGradient(40, -172, 84, -100)
        neck.addColorStop(0, shade(coat, .16))
        neck.addColorStop(1, shade(coat, -.3))
        g.fillStyle = neck
        g.beginPath()
        g.moveTo(26, -128)
        g.bezierCurveTo(50, -142, 76, -160, 100, -171)
        g.lineTo(113, -152)
        g.bezierCurveTo(99, -135, 84, -116, 68, -94)
        g.closePath()
        g.fill()
        // far ear, head, jaw, near ear
        g.fillStyle = shade(coat, -.3)
        g.beginPath(); g.moveTo(101, -172); g.lineTo(101, -189); g.lineTo(109, -174); g.closePath(); g.fill()
        g.fillStyle = coat
        g.beginPath()
        g.moveTo(95, -172)
        g.bezierCurveTo(106, -177, 121, -171, 133, -161)
        g.bezierCurveTo(143, -153, 151, -147, 153, -141)
        g.bezierCurveTo(154, -134, 149, -130, 142, -131)
        g.bezierCurveTo(133, -132, 124, -136, 116, -142)
        g.bezierCurveTo(110, -146, 106, -150, 103, -157)
        g.closePath()
        g.fill()
        g.strokeStyle = LINE
        g.lineWidth = 1.2
        g.stroke()
        g.beginPath(); g.arc(112, -154, 10, 0, TAU); g.fill()
        g.beginPath(); g.moveTo(96, -171); g.lineTo(92, -189); g.lineTo(105, -175); g.closePath(); g.fill()
        if (blaze) {
            g.fillStyle = '#efeee9'
            g.beginPath(); g.moveTo(116, -172); g.lineTo(150, -146); g.lineTo(152, -141); g.lineTo(146, -144); g.lineTo(113, -167); g.closePath(); g.fill()
        }
        g.fillStyle = shade(coat, -.55)
        g.beginPath(); g.ellipse(148, -138, 5.5, 4.5, .5, 0, TAU); g.fill()
        g.fillStyle = '#0d0907'
        g.beginPath(); g.ellipse(123, -161, 3.1, 2.5, .4, 0, TAU); g.fill()
        g.beginPath(); g.ellipse(149.5, -139.5, 1.5, 1.1, .5, 0, TAU); g.fill()
        g.fillStyle = 'rgba(255,255,255,.75)'
        g.beginPath(); g.arc(123.8, -161.8, .9, 0, TAU); g.fill()
        // bridle
        g.strokeStyle = '#1b1410'
        g.lineWidth = 2
        g.beginPath()
        g.moveTo(103, -173); g.lineTo(113, -146)
        g.moveTo(134, -160); g.lineTo(131, -134)
        g.moveTo(108, -160); g.lineTo(133, -148)
        g.stroke()
        // mane streaming back along the crest, and the forelock
        g.fillStyle = hair
        g.beginPath()
        g.moveTo(26, -129)
        g.bezierCurveTo(50, -143, 76, -161, 99, -172)
        g.lineTo(102, -179)
        if (run) {
            g.bezierCurveTo(84, -186 + wave * 3, 62, -176 + wave * 4, 46, -163 + wave * 3)
            g.bezierCurveTo(36, -154 + wave * 2, 24, -146, 14, -136 + wave * 3)
            g.bezierCurveTo(20, -134, 24, -132, 26, -129)
        } else {
            g.bezierCurveTo(88, -168, 70, -152, 52, -138)
            g.bezierCurveTo(44, -130, 36, -122, 30, -112)
            g.bezierCurveTo(30, -120, 28, -126, 26, -129)
        }
        g.closePath()
        g.fill()
        g.beginPath(); g.moveTo(96, -173); g.quadraticCurveTo(108, -185, 117, -171 + wave * 2); g.quadraticCurveTo(106, -175, 100, -168); g.closePath(); g.fill()
        g.restore()

        g.restore()

        // near legs
        leg(g, false, ...joint(-50, -94), at(.1), shade(coat, -.06), lowNear, socks)
        leg(g, true, ...joint(48, -90), at(.42), shade(coat, -.06), lowNear, false)

        g.save()
        g.translate(0, drop - 100)
        g.rotate(pitch)
        g.translate(0, 100)

        // saddle cloth and saddle
        g.fillStyle = '#f3f3f3'
        g.beginPath(); g.moveTo(-14, -130); g.lineTo(24, -128); g.lineTo(22, -99); g.lineTo(-14, -101); g.closePath(); g.fill()
        g.strokeStyle = 'rgba(0,0,0,.25)'
        g.lineWidth = 1
        g.stroke()
        g.fillStyle = '#141414'
        g.font = 'bold 21px Arial'
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.fillText(look.number, 4, -114)
        limb(g, -8, -133, 9, 20, -131, 7, '#2a1c14')

        // jockey, crouched over the withers
        const lift = run ? 2.5 * Math.sin(TAU * (t - .6)) : 0
        limb(g, 0, -138 - lift, 13, 26, -123, 10.5, '#f5f5f5')
        limb(g, 26, -123, 10, 15, -103, 8, '#191919')
        limb(g, 15, -103, 8, 24, -101, 6.5, '#191919')
        limb(g, -4, -143 - lift, 23, 36, -166 - lift, 20, look.color)
        limb(g, 9, -151 - lift, 22.5, 17, -156 - lift, 22, look.trim)
        limb(g, 33, -163 - lift, 11, 62, -148, 8.5, look.color)
        limb(g, 49, -155 - lift * .4, 9.5, 54, -152 - lift * .3, 9, look.trim)
        g.fillStyle = SKIN
        g.beginPath(); g.arc(64, -147, 4.8, 0, TAU); g.fill()
        g.beginPath(); g.arc(49, -178 - lift, 9.5, 0, TAU); g.fill()
        g.fillStyle = look.trim
        g.beginPath(); g.arc(48, -180 - lift, 11, Math.PI * .92, TAU * 1.02); g.closePath(); g.fill()
        limb(g, 54, -181 - lift, 4, 65, -178 - lift, 3, look.trim)
        limb(g, 51, -177 - lift, 4.5, 58, -176 - lift, 4.5, '#1c2530')
        g.strokeStyle = '#1b1410'
        g.lineWidth = 1.5
        // reins from the hands to the bit, which moves with the head
        const bx = 34 + 106 * Math.cos(nod) + 14 * Math.sin(nod), by = -124 + 106 * Math.sin(nod) - 14 * Math.cos(nod)
        g.beginPath(); g.moveTo(66, -147); g.lineTo(bx, by); g.stroke()
        g.restore()

        g.restore()
    }

    // data URL of a standing horse, for <img> icons
    const cache = new Map()
    const icon = look => {
        const key = [look.coat[0], look.color, look.trim, look.number].join('|')
        if (!cache.has(key)) {
            const cv = document.createElement('canvas')
            cv.width = 320
            cv.height = 240
            draw(cv.getContext('2d'), 122, 232, 1.02, look, null)
            cache.set(key, cv.toDataURL())
        }
        return cache.get(key)
    }

    return { COATS, draw, icon }
})()
