(()=>{
	let mx = (o, n, ids)=>{
		if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName){
			n.querySelectorAll?.("[id]").forEach((ne)=>{
				if (!n.contains(ne)) return
				let oe = ids[ne.id]
				if (oe){ delete ids[ne.id]; mx(oe, ne, ids); ne.replaceWith(oe) }
			})
			return o.replaceWith(n)
		}
		if (o.nodeType === 3 || o.nodeType === 8){
			if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue
			return
		}
		for (let a of [...o.attributes]) if (!n.hasAttribute(a.name)) o.removeAttribute(a.name)
		for (let a of n.attributes) if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value)
		let oIds = {}
		for (let c of o.children) if (c.id) oIds[c.id] = c
		let oc = o.firstChild, nc = n.firstChild, on, nn, m
		while (oc && nc){
			on = oc.nextSibling; nn = nc.nextSibling
			if (nc.id){
				m = oIds[nc.id]
				if (m && m !== oc){ o.insertBefore(m, oc); mx(m, nc, ids); nc = nn; continue }
				if (!m){ o.insertBefore(nc, oc); nc = nn; continue }
			}
			mx(oc, nc, ids)
			oc = on; nc = nn
		}
		while (oc){ on = oc.nextSibling; oc.remove(); oc = on }
		while (nc){ nn = nc.nextSibling; o.appendChild(nc); nc = nn }
	}
	window.morph = (target, html)=>{
		let t = document.createElement("template")
		t.innerHTML = html
		let ids = {}
		target.querySelectorAll("[id]").forEach((e)=>ids[e.id] = e)
		mx(target, t.content.firstElementChild, ids)
	}
	document.addEventListener("fx:config", (e)=>{
		if (e.detail.cfg.swap === "morph") e.detail.cfg.swap = (cfg)=>morph(cfg.target, cfg.text)
	})
})()