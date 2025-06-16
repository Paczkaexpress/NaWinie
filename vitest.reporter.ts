import type { Reporter, File, Suite, Test } from 'vitest'

function collectTests(suite: Suite | File, tests: any[], file: File) {
  for (const task of suite.tasks) {
    if (task.type === 'test') {
      tests.push({
        name: getFullName(task),
        result: task.result?.state,
        file: file.filepath,
      })
    }
    else if (task.type === 'suite') {
      collectTests(task, tests, file)
    }
  }
}

function getFullName(task: Test): string {
    let name = task.name;
    let current: Suite | undefined = task.suite;
    while (current && current.name) {
      name = `${current.name} > ${name}`;
      current = current.suite;
    }
    return name;
}


export default class CustomReporter implements Reporter {
  onFinished(files?: File[]) {
    if (!files) {
        return;
    }
    console.log('\n--- Custom Test Summary ---\n')
    const tests: any[] = []
    for (const file of files) {
      if(file) collectTests(file, tests, file)
    }

    const failed = tests.filter(t => t.result === 'fail')
    const passed = tests.filter(t => t.result === 'pass')
    const skipped = tests.filter(t => t.result === 'skip' || !t.result)

    if (failed.length > 0) {
      console.log('❌ FAILED TESTS:\n')
      failed.forEach((t) => {
        console.log(`[FAIL] ${t.file} > ${t.name}`)
      })
    }

    if (passed.length > 0) {
        console.log('\n✅ PASSED TESTS:\n')
        passed.forEach((t) => {
          console.log(`[PASS] ${t.file} > ${t.name}`)
        })
    }
    
    if (skipped.length > 0) {
        console.log('\nSKIPPED TESTS:\n')
        skipped.forEach((t) => {
            console.log(`[SKIP] ${t.file} > ${t.name}`)
        })
    }

    console.log(`\nSummary: ${passed.length} passed, ${failed.length} failed, ${skipped.length} skipped.`)
  }
} 