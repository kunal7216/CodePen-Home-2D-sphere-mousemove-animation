
gsap.registerPlugin(ScrollTrigger);


window.addEventListener('load', async function () {
const widthScreen = window.innerWidth;

let playAudio = false;

  async function createSphere() {

    let majorPlatformVersion;
    const canvasSphereWrapp = document.querySelector('#sphere-real');

    if (navigator.userAgentData) {
      if (navigator.userAgentData.platform === "Windows") {
        let ua = await navigator.userAgentData.getHighEntropyValues(["platformVersion"]);
        majorPlatformVersion = parseInt(ua.platformVersion.split('.')[0]);
      }
    }

    let sW = canvasSphereWrapp.offsetWidth;
    let halfsW = sW / 2;
    let circleW = sW / 15;

    let Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Body = Matter.Body,
        Bodies = Matter.Bodies,
        Common = Matter.Common,
        Composite = Matter.Composite,
        World = Matter.World,
        Mouse = Matter.Mouse,
        Events = Matter.Events,
        MouseConstraint = Matter.MouseConstraint;

    // create an engine
    let engine = Engine.create();

    // create a renderer
    let render = Render.create({
      element: canvasSphereWrapp,
      engine: engine,
      options: {
        isSensor: true,
        width: canvasSphereWrapp.offsetWidth,
        height: canvasSphereWrapp.offsetHeight,
        background: 'transparent',
        wireframes: false,
      }
    });

    if (majorPlatformVersion >= 13) {
      engine.timing.timeScale = 0.35;
    }

    engine.gravity.y = 1;
    engine.gravity.x = 0;
    engine.gravity.scale = 0.0025;

    // create stack circles
    let stack = [];
    for (i = 0; i < 15; i++) {
      stack.push(Bodies.circle(halfsW, halfsW, circleW, {
        density: 0.00001,
        restitution: .5,
        density: .05,
        collisionFilter: {
          category: 0x0003,
          mask: 0x0003 | 0x0001
        },
        render: {
          fillStyle: '#0C0B0B',
          strokeStyle: 'white',
          lineWidth: 2,
        }
      }))
    }
    for (i = 0; i < 20; i++) {
      stack.push(Bodies.circle(halfsW, halfsW, circleW, {
        density: 0.00001,
        restitution: .5,
        density: .05,
        collisionFilter: {
          category: 0x0004,
          mask: 0x0004 | 0x0001
        },
        render: {
          fillStyle: '#0C0B0B',
          strokeStyle: 'white',
          lineWidth: 1,
        }
      }))
    }

    Composite.add(engine.world, stack);

    // add mouse control
    let mouse = Mouse.create(render.canvas),
        mouseConstraint = MouseConstraint.create(engine, {
          mouse: mouse,
          constraint: {
            stiffness: 0.2,
            render: {
              visible: false
            }
          }
        });

    mouseConstraint.mouse.element.removeEventListener('mousewheel', mouseConstraint.mouse.mousewheel);
    mouseConstraint.mouse.element.removeEventListener('DOMMouseScroll', mouseConstraint.mouse.mousewheel);

    let shakeScene = function (engine, bodies) {
      let timeScale = (1000 / 60) / engine.timing.lastDelta;

      for (let i = 0; i < bodies.length; i++) {
        let body = bodies[i];

        if (!body.isStatic) {
          // scale force for mass and time applied
          let forceMagnitude = (0.03 * body.mass) * timeScale;

          // apply the force over a single update
          Body.applyForce(body, body.position, {
            x: (forceMagnitude + Common.random() * forceMagnitude) * Common.choose([1, -1]),
            y: -forceMagnitude + Common.random() * -forceMagnitude
          });
        }
      }
    };

    Events.on(mouseConstraint, 'mousemove', function (event) {
      // get bodies
      let foundPhysics = Matter.Query.point(stack, event.mouse.position);
      shakeScene(engine, foundPhysics);
    });

    Composite.add(engine.world, mouseConstraint);

    // keep the mouse in sync with rendering
    render.mouse = mouse;

    Render.run(render);

    r = sW / 2;
    parts = [];
    pegCount = 32;
    TAU = Math.PI * 2;
    for (i = 0; i < pegCount; i++) {
      segment = TAU / pegCount;
      angle2 = i / pegCount * TAU + segment / 2;
      x2 = Math.cos(angle2);
      y2 = Math.sin(angle2);
      cx2 = x2 * r + sW / 2;
      cy2 = y2 * r + sW / 2;
      rect = addRect({
        x: cx2, y: cy2, w: 10 / 1000 * sW, h: 400 / 1000 * sW, options: {
          angle: angle2, isStatic: true, density: 1, render: {
            fillStyle: 'transparent',
            strokeStyle: 'transparent',
            lineWidth: 0
          }
        }
      });
      parts.push(rect);
    }

    function addBody(...bodies) {
      World.add(engine.world, ...bodies);
    }

    function addRect({ x = 0, y = 0, w = 10, h = 10, options = {} } = {}) {
      body = Bodies.rectangle(x, y, w, h, options);
      addBody(body);
      return body;
    }

    // create runner
    let runner = Runner.create();

    // run the engine
    Runner.run(runner, engine);

    const dropzoneClass = 'sphere-canvas';

    let startDrag = 0;

    Events.on(mouseConstraint, 'startdrag', function (event) {
      startDrag = 1;
    });

    Events.on(mouseConstraint, 'enddrag', function (event) {
      startDrag = 0;
    });

    document.querySelector('#sphere-real canvas').classList.add('sphere-canvas');

    var targetNode = document.querySelector(".sphere-canvas");
    targetNode.style = "clip-path: circle(50%); overflow: hidden;";

    function triggerMouseEvent(node, eventType) {
      var clickEvent = document.createEvent('MouseEvents');
      clickEvent.initEvent(eventType, true, true);
      node.dispatchEvent(clickEvent);
    }

    window.addEventListener('mousemove', e => {
      if (e.toElement.getAttribute('class') != dropzoneClass && startDrag) {
        triggerMouseEvent(targetNode, "mouseup");
      }
    });

    function triggerTouchEvent(node, eventType) {
      var clickEvent = document.createEvent('TouchEvents');
      clickEvent.initEvent(eventType, true, true);
      node.dispatchEvent(clickEvent);
    }

    window.addEventListener('touchmove', e => {
      if (!e.target.classList.contains(dropzoneClass) && startDrag) {
        triggerTouchEvent(targetNode, "touchend");
      }
    });

    window.addEventListener('resize', () => {
      render.bounds.max.x = canvasSphereWrapp.offsetWidth;
      render.bounds.max.y = canvasSphereWrapp.offsetHeight;
      render.options.width = canvasSphereWrapp.offsetWidth;
      render.options.height = canvasSphereWrapp.offsetHeight;
      render.canvas.width = canvasSphereWrapp.offsetWidth;
      render.canvas.height = canvasSphereWrapp.offsetHeight;
    });

    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {

      function Channel(audio_uri) {
        this.ready = false;
        this.audio_uri = audio_uri;
        this.resource = new Audio(audio_uri);
      }

      const MaxPlaying = 3;
      let currentlyPlaying = 0;

      Channel.prototype.play = function(volume) {
        if (currentlyPlaying >= MaxPlaying) {
          return;
        }

        ++currentlyPlaying;
        // Try refreshing the resource altogether
        const copy = this.resource.cloneNode(true);
        copy.volume = volume;
        copy.play();
        setTimeout(() => {
          --currentlyPlaying;
        }, 100 + Math.random() * 400);
      }

      function Switcher(audio_uri, num) {
        this.channels = [];
        this.num = num;
        this.index = 0;

        for (var i = 0; i < num; i++) {
          this.channels.push(new Channel(audio_uri));
        }
      }

      Switcher.prototype.play = function(volume) {
        const nextIndex = this.index;
        // console.log(this.index, this.num);
        this.channels[nextIndex].play(volume);
        this.index++;
        if (this.index >= this.num) {
          this.index = 0;
        }
      }

      musicCollision = new Switcher(
        "https://cdn.zajno.com/dev/motion/sounds/sound_2_filter-2-cut.mp3",
        MaxPlaying,
      );

      let mass1 = [], mass2 = [], diffResult = [];
      diff = function (a1, a2) {
        return a1.filter(i=>!a2.includes(i))
          .concat(a2.filter(i=>!a1.includes(i)))
      }

      Events.on(engine, 'collisionStart', function(event) {
        if(!playAudio) return;
        var pairs = event.pairs;
        if (pairs.length === 0) {
          return;
        }

        const MinPenetration = 1.5;
        let maxPenetration = 0;
        pairs.forEach(p => {
          const pp = Matter.Vector.magnitude(p.collision.penetration);
          if (pp > MinPenetration && pp > maxPenetration) {
            maxPenetration = pp;
          }
        });

        const volume = maxPenetration > 0
        ? Math.min(1, maxPenetration / 10)
        : 0;

        if (volume > 0) {
          musicCollision.play(volume);
        }
      });
    }
  }

document.querySelector('.sound-icon-wrap').addEventListener('click', function () {
  this.classList.toggle('is-active');
  playAudio = this.classList.contains('is-active');
});

const sphereScroll = document.querySelector(".sphere").scrollWidth - widthScreen;

gsap.to('.sphere', {
  x: -1 * sphereScroll,
  ease: "sine.out",
  scrollTrigger: {
    trigger: ".sphere",
    pin: true,
    scrub: 1,
    start: "top top",
    end: () => "+=" + sphereScroll,
  }
});

ScrollTrigger.create({
  trigger: ".interactive",
  start: "top top",
  once: true,
  onEnter: () => {
    createSphere();
  },
});
  
  let player = document.getElementById("lottie-player");

  player.addEventListener("ready", () => {
  LottieInteractivity.create({
      player: "#lottie-player",
      mode:"cursor", 
      actions: [ { type: "hover", forceFlag: true } ]
  });
});
});
