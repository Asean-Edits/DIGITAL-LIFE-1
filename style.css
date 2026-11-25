html,
        body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #030b14;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            user-select: none;
            -webkit-user-select: none;
            -webkit-text-size-adjust: 100%;
            text-size-adjust: 100%;
            overscroll-behavior: none;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
            font-feature-settings: "tnum" 1, "cv11" 1;
            min-height: 100%;
            min-height: 100dvh;
        }

        :root {
            --dl-teal: #2dd4bf;
            --dl-teal-soft: rgba(45, 212, 191, .16);
            --dl-line: rgba(94, 234, 212, .2);
            --dl-line-hot: rgba(94, 234, 212, .42);
            --dl-ease: cubic-bezier(.2, .8, .2, 1);
        }

        .font-mono {
            font-family: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
            font-variant-numeric: tabular-nums;
            letter-spacing: -.012em;
        }

        .hud-glass {
            background:
                radial-gradient(120% 150% at 0% 0%, rgba(45, 212, 191, .11), transparent 48%),
                radial-gradient(90% 120% at 100% 100%, rgba(56, 189, 248, .06), transparent 55%),
                linear-gradient(155deg, rgba(5, 21, 33, .88), rgba(3, 10, 19, .92));
            backdrop-filter: blur(22px) saturate(165%);
            -webkit-backdrop-filter: blur(22px) saturate(165%);
            border: 1px solid var(--dl-line);
            box-shadow:
                0 26px 64px rgba(0, 0, 0, .5),
                0 2px 6px rgba(0, 0, 0, .35),
                inset 0 1px 0 rgba(165, 243, 252, .13),
                inset 0 0 0 1px rgba(255, 255, 255, .015);
            transition: border-color .25s ease, box-shadow .25s ease, background-color .2s ease;
        }

        .hud-glass:not(button) {
            border-radius: 18px;
        }

        .hud-glass:hover {
            border-color: rgba(94, 234, 212, .32);
        }

        .hud-card-accent {
            border-left: 3px solid #5eead4;
            box-shadow: -10px 0 28px -12px rgba(45, 212, 191, .45), 0 26px 64px rgba(0, 0, 0, .5), inset 0 1px 0 rgba(165, 243, 252, .13);
        }

        @keyframes dl-rise {
            from {
                opacity: 0;
                translate: 0 10px;
                filter: blur(3px);
            }

            to {
                opacity: 1;
                translate: 0 0;
                filter: blur(0);
            }
        }

        .hud-glass:not(#fpvBanner):not(#fpvTelemetryStrip):not(button) {
            animation: dl-rise .45s var(--dl-ease) both;
        }

        button,
        select,
        input,
        textarea {
            font: inherit;
            transition: background-color .18s ease, border-color .18s ease, color .18s ease,
                box-shadow .2s ease, filter .18s ease, scale .12s var(--dl-ease);
        }

        button {
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
        }

        button:hover:not(:disabled) {
            filter: brightness(1.14);
        }

        button:active:not(:disabled) {
            scale: .965;
        }

        button:disabled {
            opacity: .42;
            cursor: not-allowed;
        }

        button:focus-visible,
        select:focus-visible,
        input:focus-visible,
        textarea:focus-visible {
            outline: 2px solid #5eead4;
            outline-offset: 2px;
        }

        .fixed.bottom-3>.hud-glass,
        .fixed.bottom-5>.hud-glass {
            padding: .4rem;
            border-radius: 20px;
            box-shadow: 0 30px 70px rgba(0, 0, 0, .55), 0 0 0 1px rgba(94, 234, 212, .1), inset 0 1px 0 rgba(165, 243, 252, .14);
            scrollbar-width: none;
        }

        .fixed.bottom-3>.hud-glass::-webkit-scrollbar {
            display: none;
        }

        input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
            height: 4px;
            border-radius: 99px;
            background: linear-gradient(90deg, rgba(45, 212, 191, .55), rgba(56, 189, 248, .22));
            outline: none;
            cursor: pointer;
            accent-color: #2dd4bf;
        }

        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: #ccfbf1;
            border: 2px solid #14b8a6;
            box-shadow: 0 0 0 4px var(--dl-teal-soft), 0 2px 8px rgba(0, 0, 0, .55);
            transition: box-shadow .15s ease, scale .15s ease;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
            box-shadow: 0 0 0 7px var(--dl-teal-soft), 0 2px 8px rgba(0, 0, 0, .55);
            scale: 1.08;
        }

        input[type="range"]::-moz-range-track {
            height: 4px;
            border-radius: 99px;
            background: rgba(45, 212, 191, .35);
        }

        input[type="range"]::-moz-range-thumb {
            width: 13px;
            height: 13px;
            border-radius: 50%;
            background: #ccfbf1;
            border: 2px solid #14b8a6;
            box-shadow: 0 0 0 4px var(--dl-teal-soft);
        }

        input[type="checkbox"] {
            accent-color: #2dd4bf;
        }

        .hud-scroll,
        #speciesRosterList,
        #inspectorCard {
            scrollbar-width: thin;
            scrollbar-color: rgba(45, 212, 191, .38) transparent;
        }

        .hud-scroll::-webkit-scrollbar,
        #speciesRosterList::-webkit-scrollbar,
        #inspectorCard::-webkit-scrollbar {
            width: 5px;
        }

        .hud-scroll::-webkit-scrollbar-thumb,
        #speciesRosterList::-webkit-scrollbar-thumb,
        #inspectorCard::-webkit-scrollbar-thumb {
            background: rgba(45, 212, 191, .32);
            border-radius: 99px;
        }

        @keyframes dl-sheen {
            from {
                background-position: 120% 0;
            }

            to {
                background-position: -120% 0;
            }
        }

        #eraProgressBar,
        #dnaGrowthBar,
        #dnaEnergyBar,
        #dnaHydrationBar,
        #cultureXpBar,
        #humanAnnProgressBar {
            background-image: linear-gradient(90deg, transparent, rgba(255, 255, 255, .22), transparent);
            background-size: 220% 100%;
            animation: dl-sheen 3.2s linear infinite;
        }

        #speciesRosterList>div {
            background: linear-gradient(90deg, rgba(6, 28, 38, 0.82), rgba(8, 19, 31, 0.7));
            border-radius: 10px;
            transition: background .2s ease, translate .2s var(--dl-ease);
        }

        #speciesRosterList>div:hover {
            translate: 2px 0;
            background: linear-gradient(90deg, rgba(10, 48, 62, .9), rgba(8, 24, 38, .75));
        }

        #simCanvas {
            image-rendering: auto;
            z-index: 10;
            background: transparent;
            touch-action: none;
        }

        #world3dCanvas {
            z-index: 0;
            pointer-events: none;
        }

        body::after {
            content: "";
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 5;
            background:
                radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(1, 6, 12, .55) 100%),
                linear-gradient(180deg, rgba(1, 6, 12, .35), transparent 14%, transparent 86%, rgba(1, 6, 12, .4));
        }

        body.fpv-active::after {
            background:
                radial-gradient(112% 84% at 50% 46%, transparent 58%, rgba(4, 15, 22, .68) 100%),
                linear-gradient(180deg, rgba(2, 10, 16, .28), transparent 16%, transparent 84%, rgba(2, 10, 16, .34));
        }

        #inspectorCard {
            container-type: inline-size;
            container-name: insp;
            border-color: rgba(45, 212, 191, 0.45);
            background: linear-gradient(145deg, rgba(4, 25, 34, 0.97), rgba(4, 13, 24, 0.96));
            box-shadow: 0 0 28px rgba(20, 184, 166, 0.12), 0 18px 50px rgba(0, 0, 0, 0.35);
        }

        .insp-head {
            display: flex;
            align-items: center;
            gap: .6rem;
            margin-bottom: .75rem;
        }

        .insp-dot {
            width: 12px;
            height: 12px;
            flex: none;
            border-radius: 50%;
            background: #2dd4bf;
            box-shadow: 0 0 0 3px rgba(255, 255, 255, .07), 0 0 14px 2px var(--sp, rgba(45, 212, 191, .6));
        }

        .insp-ident {
            min-width: 0;
            flex: 1 1 auto;
        }

        .insp-title-row {
            display: flex;
            align-items: center;
            gap: .4rem;
            min-width: 0;
        }

        .insp-title {
            margin: 0;
            min-width: 0;
            font-size: 1rem;
            font-weight: 700;
            line-height: 1.2;
            letter-spacing: -.01em;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .insp-leader {
            flex: none;
            padding: 1px 7px;
            border-radius: 99px;
            font: 600 9px/1.6 'JetBrains Mono', ui-monospace, monospace;
            color: #fde68a;
            background: rgba(245, 158, 11, .2);
            border: 1px solid rgba(251, 191, 36, .5);
        }

        .insp-sub {
            display: block;
            margin-top: 1px;
            font: 500 10px/1.3 'JetBrains Mono', ui-monospace, monospace;
            color: #5eead4;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .insp-id {
            flex: none;
            padding: 2px 8px;
            border-radius: 8px;
            font: 500 10px/1.5 'JetBrains Mono', ui-monospace, monospace;
            color: #99f6e4;
            background: rgba(20, 184, 166, .16);
            border: 1px solid rgba(45, 212, 191, .35);
        }

        .insp-close {
            flex: none;
            width: 34px;
            height: 34px;
            display: grid;
            place-items: center;
            border-radius: 10px;
            border: 1px solid transparent;
            color: #94a3b8;
            font-size: 1.4rem;
            line-height: 1;
        }

        .insp-close:hover {
            color: #fff;
            background: rgba(148, 163, 184, .14);
            border-color: rgba(148, 163, 184, .28);
        }

        .insp-body {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: .7rem;
        }

        .insp-col {
            display: flex;
            flex-direction: column;
            gap: .7rem;
            min-width: 0;
        }

        @container insp (min-width: 34rem) {
            .insp-body {
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                align-items: start;
                gap: .85rem;
            }
        }

        .insp-card {
            padding: .65rem .75rem;
            border-radius: 12px;
            border: 1px solid rgba(71, 119, 130, .35);
            background: rgba(2, 10, 20, .62);
        }

        .insp-vital+.insp-vital {
            margin-top: .6rem;
        }

        .insp-vital-top {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: .5rem;
        }

        .insp-k {
            font-size: 11px;
            color: #94a3b8;
        }

        .insp-stage {
            margin-left: .3rem;
            font: 600 11px 'JetBrains Mono', ui-monospace, monospace;
            color: #fff;
        }

        .insp-muted {
            font: 500 10px/1.4 'JetBrains Mono', ui-monospace, monospace;
            color: #8aa0b4;
        }

        .insp-big {
            font: 700 1rem/1 'JetBrains Mono', ui-monospace, monospace;
            color: #fff;
        }

        .insp-low-text {
            color: #fda4af;
        }

        .insp-bar {
            height: 7px;
            margin-top: .35rem;
            border-radius: 99px;
            overflow: hidden;
            background: rgba(30, 41, 59, .95);
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, .5);
        }

        .insp-bar>div {
            border-radius: 99px;
        }

        #dnaEnergyBar.insp-low {
            animation: insp-pulse 1s ease-in-out infinite;
        }

        @keyframes insp-pulse {
            50% {
                opacity: .45;
            }
        }

        .insp-actions {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: .4rem;
        }

        .insp-btn {
            min-height: 38px;
            padding: .4rem .5rem;
            border-radius: 10px;
            border: 1px solid rgba(100, 116, 139, .5);
            font: 600 11px/1.2 'JetBrains Mono', ui-monospace, monospace;
            color: #cbd5e1;
            background: rgba(15, 23, 42, .8);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .insp-btn-follow:hover {
            border-color: rgba(45, 212, 191, .6);
            color: #fff;
        }

        .insp-btn-fpv {
            color: #fde68a;
            background: rgba(245, 158, 11, .14);
            border-color: rgba(251, 191, 36, .4);
        }

        .insp-btn-lab {
            color: #99f6e4;
            background: rgba(20, 184, 166, .2);
            border-color: rgba(45, 212, 191, .5);
        }

        .insp-btn-speed {
            color: #bae6fd;
            background: rgba(14, 165, 233, .15);
            border-color: rgba(56, 189, 248, .38);
        }

        .insp-btn-sensor {
            color: #ddd6fe;
            background: rgba(139, 92, 246, .15);
            border-color: rgba(167, 139, 250, .38);
        }

        .insp-btn-mutate {
            color: #fde68a;
            background: rgba(245, 158, 11, .2);
            border-color: rgba(251, 191, 36, .48);
        }

        .insp-btn.insp-on {
            color: #04141c;
            font-weight: 700;
            background: linear-gradient(135deg, #5eead4, #38bdf8);
            border-color: transparent;
            box-shadow: 0 0 18px rgba(45, 212, 191, .4);
        }

        .insp-btn-fpv.insp-on {
            background: linear-gradient(135deg, #fcd34d, #fb923c);
            box-shadow: 0 0 18px rgba(251, 191, 36, .4);
        }

        .insp-facts {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: .4rem;
        }

        .insp-fact:last-child:nth-child(3n + 1) {
            grid-column: 1 / -1;
        }

        .insp-fact {
            min-width: 0;
            padding: .45rem .55rem;
            border-radius: 10px;
            border: 1px solid rgba(71, 119, 130, .3);
            background: rgba(2, 10, 20, .66);
        }

        .insp-fact-k {
            display: block;
            font-size: 10px;
            color: #8aa0b4;
        }

        .insp-fact-v {
            display: block;
            margin-top: 2px;
            font: 700 12px/1.3 'JetBrains Mono', ui-monospace, monospace;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .insp-sec {
            border-radius: 12px;
            border: 1px solid rgba(71, 119, 130, .35);
            background: rgba(2, 10, 20, .62);
        }

        .insp-sec[open] {
            border-color: rgba(45, 212, 191, .28);
        }

        .insp-sum {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: .6rem;
            min-height: 40px;
            padding: .35rem .75rem;
            cursor: pointer;
            list-style: none;
            user-select: none;
            border-radius: 12px;
        }

        .insp-sum::-webkit-details-marker {
            display: none;
        }

        .insp-sum::after {
            content: "";
            flex: none;
            width: 7px;
            height: 7px;
            margin-left: .2rem;
            border-right: 2px solid #5eead4;
            border-bottom: 2px solid #5eead4;
            rotate: 45deg;
            translate: 0 -2px;
            transition: rotate .2s var(--dl-ease), translate .2s var(--dl-ease);
        }

        .insp-sec[open]>.insp-sum::after {
            rotate: 225deg;
            translate: 0 2px;
        }

        .insp-sum:hover {
            background: rgba(45, 212, 191, .06);
        }

        .insp-sum-title {
            flex: 1 1 auto;
            font-size: 12px;
            font-weight: 600;
            color: #e2f5f3;
        }

        .insp-chip {
            flex: none;
            max-width: 55%;
            padding: 1px 8px;
            border-radius: 99px;
            font: 600 10px/1.6 'JetBrains Mono', ui-monospace, monospace;
            color: #99f6e4;
            background: rgba(20, 184, 166, .16);
            border: 1px solid rgba(45, 212, 191, .35);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .insp-sec-body {
            display: flex;
            flex-direction: column;
            gap: .5rem;
            padding: .1rem .75rem .75rem;
        }

        .insp-canvas {
            display: block;
            width: 100%;
            height: auto;
            max-height: 11rem;
            aspect-ratio: 300 / 130;
            border-radius: 10px;
            border: 1px solid rgba(30, 41, 59, .9);
            background: #020a14;
        }

        .insp-thought {
            font: 500 10px/1.5 'JetBrains Mono', ui-monospace, monospace;
            color: #fde68a;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .insp-field {
            display: flex;
            flex-direction: column;
            gap: .3rem;
        }

        .insp-select {
            width: 100%;
            min-height: 38px;
            padding: .35rem .6rem;
            border-radius: 10px;
            border: 1px solid rgba(56, 189, 248, .38);
            background: rgba(2, 10, 20, .92);
            color: #fde68a;
            font: 600 11px 'JetBrains Mono', ui-monospace, monospace;
            cursor: pointer;
        }

        .insp-niche {
            display: flex;
            flex-direction: column;
            gap: .25rem;
            padding: .5rem .65rem;
            border-radius: 10px;
            background: rgba(6, 50, 56, .35);
            border: 1px solid rgba(45, 212, 191, .22);
        }

        .insp-niche-text {
            font-size: 11px;
            line-height: 1.5;
            color: #dbe7ee;
        }

        .insp-dna {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: .4rem;
        }

        @container insp (max-width: 19rem) {
            .insp-id {
                display: none;
            }

            .insp-actions,
            .insp-dna {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .insp-facts {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .insp-fact:last-child:nth-child(3n + 1) {
                grid-column: auto;
            }

            .insp-fact:last-child:nth-child(odd) {
                grid-column: 1 / -1;
            }
        }

        @media (min-width: 1024px) {
            .hud-scroll:has(#inspectorCard:not(.hidden)) {
                width: clamp(22.5rem, calc(100vw - 740px), 54rem);
            }
        }

        @media (min-width: 1024px) and (max-width: 1279px) {
            #topLeftHud {
                max-width: calc(100vw - 480px);
            }

            #eraStepperCard {
                max-width: 100%;
            }
        }

        @media (max-width: 1023px) {
            #topLeftHud {
                top: max(.5rem, env(safe-area-inset-top));
                left: max(.5rem, env(safe-area-inset-left));
                right: max(.5rem, env(safe-area-inset-right));
                width: auto;
                max-width: none;
                max-height: none;
                overflow: visible;
                gap: .4rem;
            }

            #topLeftHud>.hud-glass:first-child {
                align-self: stretch;
                flex-wrap: wrap;
                gap: .4rem .75rem;
                padding: .5rem .65rem;
                border-radius: 14px;
            }

            #topLeftHud>.hud-glass:first-child>.font-mono {
                flex: 1 1 100%;
                min-width: 0;
                max-width: 100%;
                overflow-x: auto;
                flex-wrap: nowrap;
                padding-bottom: 2px;
                scrollbar-width: none;
                -webkit-overflow-scrolling: touch;
            }

            #topLeftHud>.hud-glass:first-child>.font-mono::-webkit-scrollbar {
                display: none;
            }

            #topLeftHud>.hud-glass:first-child>.font-mono>* {
                flex: 0 0 auto;
            }

            #eraStepperCard {
                align-self: stretch;
                max-width: none;
                padding: .45rem .55rem;
                border-radius: 14px;
            }

            #eraSubtitle {
                display: none;
            }

            #eraStepperCard .grid-cols-7 {
                display: flex;
                gap: 4px;
                overflow-x: auto;
                scroll-snap-type: x proximity;
                scrollbar-width: none;
                -webkit-overflow-scrolling: touch;
            }

            #eraStepperCard .grid-cols-7::-webkit-scrollbar {
                display: none;
            }

            #eraStepperCard .grid-cols-7>button {
                flex: 0 0 auto;
                min-width: 5.4rem;
                padding: .42rem .65rem;
                font-size: 10px;
                overflow: visible;
                text-overflow: clip;
                scroll-snap-align: center;
            }

            #simToast {
                display: none;
            }

            #chronicleCard {
                display: none;
            }

            #topRightHud {
                top: auto;
                left: max(.5rem, env(safe-area-inset-left));
                right: max(.5rem, env(safe-area-inset-right));
                bottom: calc(4.1rem + env(safe-area-inset-bottom));
                width: auto;
                max-height: calc(100dvh - 12.5rem);
                align-items: stretch;
                justify-content: flex-end;
                gap: .4rem;
                padding: 0;
                pointer-events: none;
            }

            #topRightHud>* {
                pointer-events: auto;
            }

            #topRightHud>.flex:first-child {
                flex-wrap: nowrap;
                justify-content: flex-start;
                overflow-x: auto;
                padding: .25rem;
                border-radius: 14px;
                background: rgba(3, 12, 22, .78);
                backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);
                scrollbar-width: none;
                -webkit-overflow-scrolling: touch;
            }

            #topRightHud>.flex:first-child::-webkit-scrollbar {
                display: none;
            }

            #topRightHud>.flex:first-child>button {
                flex: 0 0 auto;
                min-height: 38px;
                padding: .45rem .7rem;
                white-space: nowrap;
            }

            #rightDrawerStack,
            .hud-scroll:has(#inspectorCard:not(.hidden)) {
                width: min(100%, 40rem) !important;
                align-self: flex-end;
                max-height: min(46dvh, calc(100dvh - 21rem));
                min-height: 0;
                padding-right: 0;
                overscroll-behavior: contain;
            }

            #inspectorCard {
                max-height: none;
                overflow: visible;
            }

            #inspectorCard,
            #biodiversityCard,
            #telemetryCard,
            #paramsCard,
            #lineageCard,
            #challengesCard {
                padding: .7rem;
                border-radius: 14px;
            }

            #speciesRosterList {
                max-height: 28dvh;
            }

            .fixed.bottom-3 {
                bottom: max(.5rem, calc(env(safe-area-inset-bottom) + .25rem));
                max-width: calc(100vw - 1rem);
            }

            #fpvHudStack {
                top: auto;
                bottom: calc(8.4rem + env(safe-area-inset-bottom));
                left: max(.5rem, env(safe-area-inset-left));
                right: max(.5rem, env(safe-area-inset-right));
                transform: none;
                max-width: none;
            }

            #specimenLabModal {
                padding-top: max(.75rem, env(safe-area-inset-top));
                padding-bottom: max(.75rem, env(safe-area-inset-bottom));
                padding-left: max(.75rem, env(safe-area-inset-left));
                padding-right: max(.75rem, env(safe-area-inset-right));
                overscroll-behavior: contain;
                -webkit-overflow-scrolling: touch;
            }

            #specimenLabModal canvas {
                max-width: 100%;
                height: auto;
            }
        }

        @media (max-width: 480px) {
            #topLeftHud>.hud-glass:first-child>div:first-child p {
                display: none;
            }

            #topLeftHud h1 {
                font-size: 12px;
                letter-spacing: .02em;
            }

            #spawnSpeciesSelect {
                max-width: 34vw;
            }
        }

        @media (max-width: 1023px) and (max-height: 520px) {
            #topLeftHud {
                right: auto;
                width: min(58vw, 36rem);
            }

            #topLeftHud>.hud-glass:first-child>div:first-child p {
                display: none;
            }

            #eraStepperCard .w-full.h-1 {
                display: none;
            }

            #topRightHud {
                top: max(.5rem, env(safe-area-inset-top));
                bottom: calc(3.7rem + env(safe-area-inset-bottom));
                left: auto;
                width: min(38vw, 22rem);
                max-height: none;
                justify-content: flex-start;
            }

            #rightDrawerStack,
            .hud-scroll:has(#inspectorCard:not(.hidden)) {
                width: 100% !important;
                max-height: none;
                flex: 1 1 auto;
                min-height: 0;
            }

            .fixed.bottom-3 {
                max-width: calc(100vw - 1rem);
            }
        }

        @media (pointer: coarse) {
            .fixed.bottom-3 button {
                min-height: 40px;
            }

            #eraStepperCard button,
            .hud-glass button {
                min-height: 32px;
            }

            .insp-btn {
                min-height: 42px;
            }

            .insp-sum {
                min-height: 44px;
            }

            .insp-close {
                width: 40px;
                height: 40px;
            }

            .insp-select {
                min-height: 42px;
                font-size: 12px;
            }

            input[type="range"] {
                height: 6px;
            }

            input[type="range"]::-webkit-slider-thumb {
                width: 20px;
                height: 20px;
            }

            input[type="range"]::-moz-range-thumb {
                width: 18px;
                height: 18px;
            }

            input[type="checkbox"] {
                width: 18px;
                height: 18px;
            }

            .hud-glass:hover {
                border-color: var(--dl-line);
            }

            #speciesRosterList>div:hover {
                translate: 0 0;
            }
        }

        @media (prefers-reduced-motion: reduce) {

            .hud-glass,
            button,
            #speciesRosterList>div,
            #eraProgressBar,
            #dnaGrowthBar,
            #dnaEnergyBar,
            #dnaHydrationBar,
            #cultureXpBar,
            #humanAnnProgressBar,
            .insp-sum::after {
                animation: none !important;
                transition: none !important;
            }
        }


/* Immersive FPV clean view: keep both world canvases visible and hide all UI. */
body.fpv-clean-view > :not(canvas):not(#fpvRestoreUiButton) { display: none !important; }
body.fpv-clean-view #fpvRestoreUiButton { display: flex !important; align-items: center; justify-content: center; }
body.fpv-clean-view { cursor: crosshair; }
