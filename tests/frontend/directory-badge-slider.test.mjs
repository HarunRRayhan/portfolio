import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const componentPath = fileURLToPath(new URL('../../resources/js/Components/DirectoryBadgeSlider.tsx', import.meta.url))

const expectedBadges = [
    `<a href="https://earlyhunt.com/project/skaleagents" target="_blank" rel="noopener">
  <img src="https://earlyhunt.com/badges/earlyhunt-badge-light.svg" alt="Featured on EarlyHunt" width="265" height="58" />
</a>`,
    `<a href="https://sumodir.com" target="_blank" rel="dofollow"><img src="https://sumodir.com/badge.png" alt="Featured on SumoDir" width="200" height="54" /></a>`,
    `<a href="https://twelve.tools" target="_blank"><img src="https://twelve.tools/badge0-white.svg" alt="Featured on Twelve Tools" width="148" height="40"></a>`,
    `<a href="https://dododirectory.com" target="_blank" rel="dofollow"><img src="https://dododirectory.com/badge-light.png" alt="Featured on DodoDirectory" width="200" height="54" /></a>`,
    `<a href="https://wired.business" target="_blank"><img src="https://wired.business/badge0-white.svg" alt="Featured on Wired Business" width="200" height="54"></a>`,
    `<a href="https://tools.launchllama.co?utm_source=badge&utm_medium=referral" target="_blank" rel="noopener noreferrer">
  <img src="https://tools.launchllama.co/featured-badge.png?v=2"
    alt="Featured on Launch Llama Tools"
    width="200" height="52" />
</a>`,
    `<a href="https://aihustle.tools" target="_blank" rel="noopener">AI Hustle</a>`,
    `<a href="https://showmebest.ai" target="_blank"><img src="https://showmebest.ai/badge/feature-badge-white.webp" alt="Featured on ShowMeBestAI" width="220" height="60"></a>`,
    `Featured on <a href="https://aitoolsmarketer.com/">AI Tools for Marketers</a>`,
    `<a href="https://launchboosts.com/project/crontinel" target="_blank"><img src="https://launchboosts.com/badges/featured-dark.svg" alt="Featured on LaunchBoosts" width="180" height="54" /></a>`,
    `<a href="https://www.aitoolsaver.com" target="_blank">Featured on AiToolSaver</a>`,
    `<a href="https://saasbison.com" target="_blank" rel="dofollow"><img src="https://saasbison.com/badge.png" alt="Featured on SaaSBison" width="200" height="54" /></a>`,
    `<a href="https://dang.ai" target="_blank" rel="dofollow noopener" style="display:inline-block;text-decoration:none;"><img src="https://assets.dang.ai/badges/dang-verified-dark.png" alt="Verified on DANG!" width="260" height="94" style="display:block;width:260px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" /></a>`,
    `<a href="https://www.launchvault.dev" target="_blank" title="Feature On Launch Vault">
  <img
    src="https://www.launchvault.dev/images/badges/launch-valut-badge.svg"
    alt="Feature On Launch Vault"
    style="width: 195px; height: auto;"
  />
</a>`,
    `<a href="https://indiehunt.io/project/appnary" target="_blank" rel="noopener">
  <img src="https://indiehunt.io/badges/indiehunt-badge-light.svg" alt="Featured on IndieHunt" width="265" height="58" />
</a>`,
    `<a href="https://www.superlaun.ch/products/3530" target="_blank" rel="noopener">
  <img src="https://www.superlaun.ch/badge.png" alt="Featured on Super Launch" width="300" height="300" />
</a>`,
]

test('directory badge markup appears exactly once per supplied block', () => {
    assert.ok(existsSync(componentPath), 'the footer directory badge slider should exist')

    const source = readFileSync(componentPath, 'utf8')

    assert.equal(expectedBadges.length, 16)
    assert.match(source, /transition-opacity/)
    assert.match(source, /rotationIntervalMs = 5000/)
    for (const markup of expectedBadges) {
        assert.equal(source.split(markup).length - 1, 1, `Expected one exact copy of ${markup}`)
    }
})
