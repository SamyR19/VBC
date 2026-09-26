import { expect, test, type Page } from '@playwright/test'

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `e2e/screenshots/${test.info().project.name}-${name}.png`, fullPage: true })

const mainPrice = (page: Page) => page.getByRole('textbox', { name: /^Main price/ })

async function openPricing(page: Page) {
  if (!(await mainPrice(page).isVisible())) await page.getByRole('button', { name: /^Pricing/ }).click()
}

async function onboard(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Set up your team' })).toBeVisible()
  await page.getByLabel('Team name').fill('Lincoln VBC')
  await page.getByLabel('Team members').fill('Samy Rabah, Alex')
  await page.getByLabel('Business (optional)').selectOption('Smoothie shop')
  await page.getByRole('button', { name: 'Create team' }).click()
  await expect(page.getByRole('heading', { name: 'Practice' })).toBeVisible()
}

test('core loop: onboard → log → compare to PB → ideas → attempts filters/compare → checklist', async ({ page }) => {
  await onboard(page)
  await expect(page.locator('main').getByText(/Round 1 opens in/)).toBeVisible()
  await shot(page, '01-home-empty')

  // Hypothesis is required.
  await page.goto('/attempts/new')
  await page.getByLabel('Final profit').fill('100')
  await page.getByRole('button', { name: 'Save results' }).click()
  await expect(page).toHaveURL(/\/attempts\/new/)

  // Operator defaults to the first teammate.
  await expect(page.getByLabel('Operator')).toHaveText(/Samy Rabah/)
  await expect(page.getByLabel('Operator').locator('option:checked')).toHaveText('Samy Rabah')

  // Baseline run with structured decisions and detailed results.
  await page.getByLabel('Hypothesis').fill('Baseline: default settings')
  await openPricing(page)
  await mainPrice(page).fill('5.00')
  await page.getByRole('button', { name: /^Financing/ }).click()
  await page.getByRole('textbox', { name: /^Bank loan amount/ }).fill('50000')
  await page.getByLabel('Final profit').fill('$12,500')
  await page.getByLabel('Final net worth').fill('40000')
  await page.getByLabel('Total revenue').fill('90000')
  await page.getByLabel('Lowest cash').fill('1200')
  await page.getByLabel('Took a loan?').selectOption('yes')
  await page.getByLabel('Debt remaining').fill('20000')
  await page.getByRole('button', { name: '+ Add year-by-year numbers' }).click()
  await page.getByLabel('Year 1 profit').fill('1000')
  await page.getByLabel('Year 2 profit').fill('4000')
  await page.getByRole('button', { name: 'Save results' }).click()
  await expect(page).toHaveURL(/\/attempts\/[0-9a-f-]{36}$/)
  await expect(page.locator('main').getByText('PB', { exact: true })).toBeVisible()
  await expect(page.locator('main').getByText('Debt remaining')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Year by year' })).toBeVisible()

  // Second run starts from the PB decisions; change one variable.
  await page.goto('/attempts/new')
  await openPricing(page)
  await expect(mainPrice(page)).toHaveValue('5.00')
  await page.getByLabel('Hypothesis').fill('Raise smoothie price to $5.50')
  await mainPrice(page).fill('5.50')
  await expect(page.locator('main').getByText('Changed vs. baseline: Main price.')).toBeVisible()
  await expect(page.locator('main').getByText('was: 5.00')).toBeVisible()
  await page.getByLabel('Final profit').fill('15000')
  await page.getByLabel('Final net worth').fill('38000')
  await page.getByLabel('Verdict').selectOption('keep')
  await shot(page, '02-new-attempt')
  await page.getByRole('button', { name: 'Save results' }).click()
  await expect(page.locator('main').getByText(/New personal best/)).toBeVisible()
  await expect(page.locator('main').getByText('+$2,500').first()).toBeVisible()
  await expect(page.getByRole('cell', { name: '5.50' })).toBeVisible()
  await shot(page, '03-attempt-detail')

  // Detailed idea → Test it pre-applies the "to" value.
  await page.goto('/backlog')
  await page.getByRole('button', { name: '+ New idea' }).click()
  await page.getByLabel('Idea', { exact: true }).fill('Try $6.00')
  await page.getByLabel('Area', { exact: true }).selectOption('Pricing')
  await page.getByLabel('Decision to change').fill('Main price')
  await page.getByRole('button', { name: 'Use PB' }).click()
  await expect(page.getByLabel('From (current value)')).toHaveValue('5.50')
  await page.getByLabel('To (new value)').fill('6.00')
  await page.getByLabel('Expected effect').fill('Higher margin, similar volume')
  await page.getByRole('button', { name: 'Add idea' }).click()
  await expect(page.locator('main').getByText('Main price: 5.50 → 6.00')).toBeVisible()
  await shot(page, '04-ideas')
  await page.getByRole('link', { name: 'Test it' }).click()
  await expect(page.getByLabel('Hypothesis')).toHaveValue(/Try \$6\.00 — Expect: Higher margin/)
  await openPricing(page)
  await expect(mainPrice(page)).toHaveValue('6.00')
  await page.getByLabel('Final profit').fill('11000')
  await page.getByLabel('Final net worth').fill('45000')
  await page.getByRole('button', { name: 'Save results' }).click()
  await expect(page.locator('main').getByText('vs. personal best')).toBeVisible()
  await page.goto('/backlog')
  await expect(page.locator('main').getByText('No queued ideas')).toBeVisible()

  // What's working table on Home.
  await page.goto('/')
  await expect(page.locator('main').getByText('What’s working (from your clean tests)')).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Main price' })).toBeVisible()
  await expect(page.locator('main').getByText('$15,000').first()).toBeVisible()
  await shot(page, '05-home')

  // Attempts: clean-only filter and compare.
  await page.goto('/attempts')
  await page.getByRole('button', { name: /^Filters/ }).click()
  await page.getByLabel(/Clean tests only/).check()
  await expect(page.locator('main').getByText('Baseline: default settings').filter({ visible: true })).toHaveCount(0)
  await page.getByLabel(/Clean tests only/).uncheck()
  const boxes = page.getByRole('checkbox', { name: 'Select for compare' }).filter({ visible: true })
  await boxes.nth(0).check()
  await boxes.nth(1).check()
  await shot(page, '06-attempts')
  await page.getByRole('button', { name: 'Compare 2 runs' }).click()
  await expect(page.getByRole('heading', { name: 'Compare runs' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Main price' })).toBeVisible()

  // Checklist
  await page.goto('/round')
  await page.getByRole('button', { name: 'Load default checklist' }).click()
  await page.getByRole('checkbox', { name: /Advisor approval confirmed/ }).check()
  await expect(page.locator('main').getByText('1/9 done')).toBeVisible()

  // Metric switch to net worth changes the PB.
  await page.goto('/settings')
  await page.getByRole('button', { name: /Practice/ }).click()
  await page.getByLabel('Ranking metric').first().selectOption('net_worth')
  await page.goto('/')
  await expect(page.locator('main').getByText('$45,000').first()).toBeVisible()

  // Data survives reload; CSV export downloads.
  await page.reload()
  await page.goto('/settings')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export attempts (CSV)' }).click()])
  expect(download.suggestedFilename()).toMatch(/lincoln-vbc-attempts-.*\.csv/)
})

test('guide panel and AI coach (OpenAI mocked)', async ({ page }) => {
  let openaiBody: { input: { content: string }[] } | null = null
  await page.route('https://api.openai.com/v1/responses', async (route) => {
    openaiBody = route.request().postDataJSON()
    const reply = {
      reply: 'Your **price** test worked.\n- Try one more step up\n- Then test marketing',
      ideas: [
        { idea: 'Raise main price to $6.00', category: 'Pricing', variable: 'Main price', from_value: '5.50', to_value: '6.00', expected_effect: '+ profit', rationale: 'price up helped', priority: 2, effort: 'quick' },
      ],
      follow_ups: ['What about wages?'],
    }
    await route.fulfill({ json: { output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(reply) }] }] } })
  })

  await onboard(page)
  const isDesktop = test.info().project.name === 'desktop'

  // Guide: left column on desktop, collapsible on phones.
  await page.goto('/attempts/new')
  if (isDesktop) {
    await expect(page.getByRole('complementary', { name: 'How to' }).getByText('1 · Plan the run')).toBeVisible()
  } else {
    await page.getByRole('button', { name: /How to:/ }).click()
    await expect(page.locator('main').getByText('1 · Plan the run').first()).toBeVisible()
  }
  await shot(page, '07-guide')

  // Coach without a key explains how to set it up.
  const coach = page.getByLabel('AI coach', { exact: true }).filter({ visible: true })
  if (!(await coach.isVisible())) await page.getByRole('button', { name: '✨ AI coach' }).click()
  await coach.getByRole('button', { name: '💡 Suggest next experiments' }).click()
  await expect(coach.getByText(/Add your OpenAI API key/)).toBeVisible()

  // Add a key in settings, then ask again.
  await page.goto('/settings')
  await page.getByLabel('OpenAI API key').fill('sk-test')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.goto('/')
  const coach2 = page.getByLabel('AI coach', { exact: true }).filter({ visible: true })
  if (!(await coach2.isVisible())) await page.getByRole('button', { name: '✨ AI coach' }).click()
  await coach2.getByRole('button', { name: '💡 Suggest next experiments' }).click()
  await expect(coach2.getByText('Try one more step up')).toBeVisible()
  expect(JSON.stringify(openaiBody)).toContain('TEAM DATA')
  expect(JSON.stringify(openaiBody)).not.toContain('Samy')
  await coach2.getByRole('button', { name: '+ Add to experiment ideas' }).click()
  await expect(coach2.getByRole('button', { name: '✓ Added to ideas' })).toBeVisible()
  await shot(page, '08-coach')

  await page.goto('/backlog')
  await expect(page.locator('main').getByText('Raise main price to $6.00')).toBeVisible()
  await expect(page.locator('main').getByText('by AI coach')).toBeVisible()
})
