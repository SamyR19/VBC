import { expect, test, type Page } from '@playwright/test'

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `e2e/screenshots/${test.info().project.name}-${name}.png`, fullPage: true })

async function logAttempt(page: Page, opts: { hypothesis: string; profit: string; netWorth?: string; price?: string }) {
  await page.goto('/attempts/new')
  await page.getByLabel('Hypothesis').fill(opts.hypothesis)
  if (opts.price) {
    const priceValue = page.getByLabel('Decision 1 value')
    if (await priceValue.count()) await priceValue.fill(opts.price)
    else {
      await page.getByRole('button', { name: '+ Price' }).click()
      await page.getByLabel('Decision 1 value').fill(opts.price)
    }
  }
  await page.getByLabel('Final profit ($)').fill(opts.profit)
  if (opts.netWorth) await page.getByLabel('Final net worth ($)').fill(opts.netWorth)
  await page.getByRole('button', { name: 'Save results' }).click()
  await expect(page).toHaveURL(/\/attempts\/[0-9a-f-]{36}$/)
}

test('core loop: onboard → log → compare to PB → queue idea → checklist → metric switch', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Set up your team' })).toBeVisible()
  await shot(page, '01-onboarding')
  await page.getByLabel('Team name').fill('Lincoln VBC')
  await page.getByLabel('Team members').fill('Sam, Alex')
  await page.getByLabel('Business (optional)').selectOption('Smoothie shop')
  await page.getByRole('button', { name: 'Create team' }).click()

  // Home defaults to Practice before Round 1 opens, and shows the next deadline.
  await expect(page.getByRole('heading', { name: 'Practice' })).toBeVisible()
  await expect(page.getByText(/Round 1 opens in/)).toBeVisible()

  // Hypothesis is required.
  await page.goto('/attempts/new')
  await page.getByLabel('Final profit ($)').fill('100')
  await page.getByRole('button', { name: 'Save results' }).click()
  await expect(page).toHaveURL(/\/attempts\/new/)

  await logAttempt(page, { hypothesis: 'Baseline: default settings', profit: '$12,500', netWorth: '40000', price: '5.00' })
  await expect(page.getByText('PB', { exact: true })).toBeVisible()

  // Second run starts from the PB decisions; change one variable.
  await page.goto('/attempts/new')
  await expect(page.getByLabel('Decision 1 value')).toHaveValue('5.00')
  await page.getByLabel('Hypothesis').fill('Raise smoothie price to $5.50')
  await page.getByLabel('Decision 1 value').fill('5.50')
  await expect(page.getByText('Changed vs. baseline: Price')).toBeVisible()
  await page.getByLabel('Final profit ($)').fill('15000')
  await page.getByLabel('Final net worth ($)').fill('38000')
  await page.getByLabel('Verdict').selectOption('keep')
  await shot(page, '02-new-attempt')
  await page.getByRole('button', { name: 'Save results' }).click()
  await expect(page.getByText(/New personal best/)).toBeVisible()
  await expect(page.getByText('+$2,500').first()).toBeVisible()
  await expect(page.getByRole('cell', { name: '5.50' })).toBeVisible()
  await shot(page, '03-attempt-detail')

  // Queue an idea from the detail page, then test it from the backlog.
  await page.getByLabel('Next experiment idea').fill('Try $6.00')
  await page.getByRole('button', { name: 'Add idea' }).click()
  await page.goto('/backlog')
  await page.getByRole('link', { name: 'Test it' }).click()
  await expect(page.getByLabel('Hypothesis')).toHaveValue('Try $6.00')
  await page.getByLabel('Decision 1 value').fill('6.00')
  await page.getByLabel('Final profit ($)').fill('11000')
  await page.getByLabel('Final net worth ($)').fill('45000')
  await page.getByRole('button', { name: 'Save results' }).click()
  await expect(page.getByText('vs. personal best')).toBeVisible()
  await page.goto('/backlog')
  await expect(page.getByText('No queued ideas')).toBeVisible()

  // Plan-first flow.
  await page.goto('/attempts/new')
  await page.getByLabel('Hypothesis').fill('Hire one more employee')
  await page.getByRole('button', { name: 'Save plan, run later' }).click()
  await expect(page.getByText('Planned — finish logging')).toBeVisible()

  await page.goto('/')
  await expect(page.getByText('$15,000').first()).toBeVisible()
  await shot(page, '04-home')

  await page.goto('/attempts')
  await expect(page.getByText('Raise smoothie price to $5.50').filter({ visible: true }).first()).toBeVisible()
  await shot(page, '05-attempts')

  // Switching the metric to net worth changes the PB.
  await page.goto('/settings')
  await page.getByRole('button', { name: /Practice/ }).click()
  await page.getByLabel('Ranking metric').first().selectOption('net_worth')
  await page.goto('/')
  await expect(page.getByText('$45,000').first()).toBeVisible()

  // Checklist
  await page.goto('/round')
  await page.getByRole('button', { name: 'Load default checklist' }).click()
  await page.getByRole('checkbox', { name: /Advisor approval confirmed/ }).check()
  await expect(page.getByText('1/9 done')).toBeVisible()
  await shot(page, '06-round')

  // Round 1 shows ET schedule and mini-challenges.
  await page.getByLabel('Active round').selectOption({ label: 'Round 1' })
  await expect(page.getByText(/Tue, Oct 13, 10:00 AM EDT/)).toBeVisible()
  await expect(page.getByText('Mini-challenge 1')).toBeVisible()

  // Data survives reload (localStorage).
  await page.reload()
  await page.goto('/attempts')
  await page.getByLabel('Round filter').selectOption('all')
  await expect(page.getByText('Try $6.00').filter({ visible: true }).first()).toBeVisible()

  // CSV export downloads.
  await page.goto('/settings')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export attempts (CSV)' }).click()])
  expect(download.suggestedFilename()).toMatch(/lincoln-vbc-attempts-.*\.csv/)
  await shot(page, '07-settings')
})
