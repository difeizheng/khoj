#!/usr/bin/env python3
"""
khoj Web UI i18n 注入器
------------------------
从官方镜像导出的 built/ 静态目录里，给每个 HTML 文件注入 khoj-i18n.js 引用。
幂等：重复运行会先移除旧注入标记再注入。产物输出到 dist/。

用法：
    python inject.py <built_src_dir> <dist_dir> <script_public_url>
    # script_public_url 例：/static/khoj-i18n.js
"""
import re
import shutil
import sys
from pathlib import Path

INJECT_MARK = '<!-- khoj-i18n -->'


def inject_into_html(html: str, script_url: str) -> str:
    # 幂等：先移除旧注入（含任意 query 参数版本）
    html = re.sub(
        re.escape(INJECT_MARK) + r'\s*<script[^>]*khoj-i18n[^>]*></script>\s*',
        '', html)
    tag = f'{INJECT_MARK}<script src="{script_url}" defer></script>'
    if '</head>' in html:
        return html.replace('</head>', tag + '\n</head>', 1)
    if '</body>' in html:  # 兜底
        return html.replace('</body>', tag + '\n</body>', 1)
    return html  # 没 head/body 的碎片不动


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    src = Path(sys.argv[1]).resolve()
    dist = Path(sys.argv[2]).resolve()
    url = sys.argv[3]
    # 防御：若被 MSYS 改写成 C:/Program Files/Git/static/... 则还原为根相对路径
    m = re.search(r'(/static/khoj-i18n\.js\?v=\w+)$', url) or re.search(r'(/static/khoj-i18n\.js)$', url)
    if m:
        url = m.group(1)

    if dist.exists():
        shutil.rmtree(dist)
    shutil.copytree(src, dist)

    count = 0
    for html_file in dist.rglob('*.html'):
        text = html_file.read_text(encoding='utf-8')
        new = inject_into_html(text, url)
        if new != text:
            html_file.write_text(new, encoding='utf-8')
            count += 1
    print(f'注入完成：{count} 个 HTML 文件 -> {dist}')


if __name__ == '__main__':
    main()
