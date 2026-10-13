# Python Steps Lab — 测试与质量检查

## 独立副本验证

迁移前的验证记录保留如下，包含旧入口名称和 Reading Steps 回归背景；这些历史记录不代表新部署已验证。迁移后的自动检查结果见下表。GitHub Pages、真实浏览器和网络失败场景仍需部署后复测。

### 2026-10-13 独立副本检查结果

| 检查 | 结果 |
| --- | --- |
| 六个 JavaScript 文件的 `node --check` | 全部通过 |
| `node test-python.js` | 通过；29 个参考程序、课程检查、210 星、七徽章、持久化和错误限制 |
| Worker 生命周期替身 | 通过；加载、停止、超时、重试和清理 |
| 真实应用处理函数的 DOM/runner 替身 | 通过全部 29 个任务及项目检查点 |
| 首页资源与导航 | 所有本地引用存在，无根绝对资源路径，无旧 Reading Steps 返回链接 |
| 原项目保护 | 十个读取/迁出来源文件的复制前后 SHA-256 相同 |

本次没有启动浏览器或下载 Pyodide，没有运行 Git 初始化、提交、推送，也没有开启 Pages。这些结果不代表真实浏览器或新部署已验证。

## 迁移前历史记录

## Python Steps Lab — implementation and verification

Python Lab is a separate static page. Only a local navigation link was added to Reading Steps for this feature; its lessons, state, privacy, scoring, sound, and celebration behavior are retained. No dependencies were installed and no backend was added.

### Automated checks actually passed

```sh
node --check python-lessons.js
node --check python-core.js
node --check python-runner.js
node --check python-steps.js
node --check test-python.js
node test-python.js
```

`test-python.js` runs the exact Python host shipped to the browser under local CPython. All **29 reference programs** run and meet their task rules. It covers decision boundaries (including heights 119, 120, 200, 201), changing Robot Interview replies, Guess the Number with a fixed check secret, functions/lists/f-strings, numeric vs text values, loop stopping, seven friendly error categories, denied modules/calls/introspection, bounded operations, one-time stars, 210-star cap, seven badges, lock order, and normalized draft/input/hint restoration. Negative examples cannot pass by printing a matching number while leaving the requested variable unused.

Worker substitutes cover loading, unavailable execution, ready messages, termination, stale responses, the 6-second run timeout, 45-second load failure, retries, and timer cleanup. A DOM substitute drives the **real app handlers** through all 29 tasks: project build checkpoints, navigation, challenge/project completion pages, saved stars/badges/outputs, hint ladder, repeated Check, concurrent edits during a run, shortcut saving, Teacher View, and double-confirmed reset. These adapter tests are **not real-browser, Pyodide, audio, or assistive-technology tests**.

The existing Reading Steps state tests and data/privacy checks also passed. Python Lab alone has a separate localStorage key and downloads the Python runtime; Reading Steps continues to load only its own local files and keep student answers in memory.

### Real browser checks actually performed

Tested in **Google Chrome by opening `python-steps.html` directly as a file URL**, without a server or build:

| Path | Observed result |
| --- | --- |
| Unit 1 Step 1 | Pyodide loaded; Run printed `Hello, world!`; Check awarded 5 stars and enabled Next Step. |
| Unit 1 Step 2 | Typed a new message; Check ran it and awarded the next 5 stars. |
| Unit 1 Step 3 | Broken starter produced the quotation-mark explanation with raw details collapsed. Fixed code ran and passed. |
| Unit 1 Step 4 / Challenge | Three real print lines passed; the poster challenge showed its finished output, +10 stars, and Message Maker. Map showed 5/5, 30 stars, and Unit 2 unlocked. |
| Refresh | Current step, edited code, stars, completion, badge, and a used hint were restored. Teacher View retained the previous SyntaxError. |
| Unit 2 variables / Text vs Number | In Teacher preview, numeric score code printed 15 and passed. A final smoke check of the latest scripts printed a stored name and passed its variable-use check. |
| Robot Interview | In Teacher preview, sequential build checkpoints unlocked; Test Inputs supplied Sky/otter; Output showed questions, replies, and personalized responses. Final Check passed, including an alternate-name/animal test. |
| Unit 4 even/odd | In Teacher preview, int/input/if/else program ran and passed its 4/5 test cases. |
| Unit 5 for / while | In Teacher preview, range(5) printed exactly five messages; a while counter printed 1, 2, 3 and stopped. |
| Runaway while repair | Unchanged starter was stopped and showed “Your loop may not have a way to stop…”. Adding the counter update printed 1–5 and passed. |
| Guess the Number Check | In Teacher preview, Test Inputs 5, 17, 12 produced Too low!, Too high!, Correct!, You won!, then terminated and passed. |
| Guess the Number Run | Random mode differed from the fixed Check secret. Exhausted replies produced a friendly request for another Test Input. Appending replies 1–20 completed a real random game (observed secret 8). |
| Keyboard | Tab inserted four spaces and kept editor focus; Escape moved to Check; Cmd+Enter ran; Cmd+S displayed “Your work is saved automatically.” |
| Layout | At the tested window’s 75% zoom the lab used readable side-by-side cards; at 100% it stacked them. Screenshots inspected map, guide, input rows, editor, output, and completion layout. Physical phone testing was not performed. |
| Reading Steps regression | Original HTML opened, Sound was Off, Continue opened the original question, and a first correct Check still added 10 Practice Points with the original feedback. |

Later-unit browser checks used Teacher preview to avoid fabricating learner completion or bypassing the map locks. Their stars, badges, and project completion rewards were verified through actual app handlers with DOM/CPython adapters, not through a full real-browser 29-step learner route. The 30 test stars and preview drafts were cleared on 2026-10-13 as recorded below; they are not student learning records.

### Test-data cleanup — real Chrome verification, 2026-10-13

At the user's explicit request, used the existing Python Lab Teacher View → Reset Progress and accepted both confirmations. Only the test data under `python-steps-lab:v1` was replaced with a fresh Python Lab state. The reset implementation writes this single key; it does not call `localStorage.clear()`, touch other keys, or reset Reading Steps. No course content, app code, or reward rules changed during cleanup.

Observed immediately after reset **and again after a real Chrome page refresh**:

- **0 stars**, **0 / 29 steps complete**, and no earned badges.
- Unit 1 / Make Python Talk: **Unlocked**, 0 / 5 complete, enabled start button.
- Unit 2, Unit 3, Project 1, Unit 4, Unit 5, Project 2: **Locked**, zero completion, disabled start buttons in the existing learning order.

The page was left on this fresh learning map. No Run or Check was performed after cleanup, so no new test rewards were created.

### Coverage boundaries — automated / browser-tested / not yet browser-tested

| Category | Evidence and scope |
| --- | --- |
| Automated coverage | Prior `test-python.js` CPython/core, DOM-handler, and Worker-substitute checks cover all 29 tasks, reward/lock rules, persistence, error handling, and reset logic. These are not full browser runs. Prior Reading Steps tests also passed. They were not rerun for this documentation-only cleanup. |
| Real browser coverage | Chrome file-URL checks listed above; additionally, the two-confirmation reset, fresh-state map, and persistence of that initial state after refresh were verified on 2026-10-13. |
| Not yet tested in a real browser | Full 29-task learner route and all later-unit reward paths; forced offline/load failure and network inspection; storage-denied/quota conditions; physical mobile devices; comprehensive screen-reader and reduced-motion checks; Live Server/static-server mode and browsers other than Chrome. Some of these have automated substitute coverage, not real-browser verification. |

### Remaining manual checks / exact retest instructions

1. Open `./index.html` through Live Server or a local static server. For a clean learner route, export any existing work, then use Teacher View → Reset Progress and accept both confirmations. Verify 0 stars, only Unit 1 unlocked, and no badges.
2. Run and Check the first print; change a message; run the broken quotes starter, then fix it; finish the remaining tasks. Next Step stays disabled until Check passes. Challenges display a completion page and new badge. Repeat a completed Check and verify stars do not increase.
3. For quick teacher testing, open `#teacher` and preview the requested task. Hint 1 and Hint 2 precede Show Example; reference code is labeled “Use this to learn, then try typing it yourself.” Type it in the editor. For projects, press Check Build Step after each part, then Run / Check Project. Preview never awards stars or completion.
4. Robot Interview: use Name `Sky` and Animal `otter`; run, inspect the questions/replies, and Check. Change them to another nickname and animal and rerun. Guess the Number: use `5, 17, 12` for Check. For random Run, add replies 1–20. Test empty/non-numeric input and an incomplete loop; errors never deduct stars.
5. Park checker: try height inputs 119, 120, 200, 201. Put `> 200` before `>= 120`. Its Check also runs these boundaries. Test both branches of even/odd, the three score branches, for ranges, and a repaired while counter.
6. Refresh after editing and using hints; verify current learner step, draft, Test Inputs, completed tasks, stars, badges, hint usage, and saved output in Teacher View / Export JSON. Try Reset Code and cancel first; accepting replaces only that draft. Reset Progress must require two confirmations and affect only Python Lab.
7. **Offline / runtime failure remains a manual browser check**: use DevTools Network Offline, disable cache, and reload. After the loading limit, verify the exact runner failure message, editable drafts and hints, and provisional Check feedback with no invented output or awarded stars. Restore network and Try Loading Python. Network should show only runtime distribution loads, not student-code uploads or package installs.
8. **Storage-denied/quota, true mobile, and full screen-reader behavior remain manual**: block storage and confirm a save warning plus usable editing/export; test approximately 375px width and 200% text; Tab through controls, use Escape from the editor, and check output announcements with VoiceOver/NVDA. Try reduced motion: the finished card remains, but the brief star animation stops/does not start. These behaviors were implemented; they were not all verified on real devices.

Version 1 intentionally has no extra bonus stars, Turtle canvas, runtime package installation, live pause-and-resume input dialogue, JSON import, cloud sync, or general Python support. Checks combine AST/runtime metadata, output, and a small set of examples; they cannot understand every creative message or prove arbitrary program correctness. Text describing personal details or positive messages still benefits from a teacher’s review. Supported expression formats are documented in README.
