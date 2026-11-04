#!/usr/bin/env python3
"""드라이브 「class 자료실」 폴더를 psy.ai.kr/class 로 옮긴다.

드라이브 규칙: 「class 자료실」 안에 자료마다 폴더 하나, 그 안에 PDF 하나.
  폴더 이름 = 사이트에 보일 제목. 폴더 이름을 「교재 · 제목」처럼 쓰면 앞부분이 분류가 된다(없으면 학습지).

하는 일: 새 PDF나 바뀐 PDF만 골라
  class/books/<slug>/file.pdf     내려받기용 원본
  class/books/<slug>/pNN.jpg      넘겨 보기용 쪽 그림
  class/books/<slug>/tNN.jpg      책 넘김용 작은 그림
을 만들고 class/books.json 을 고친다. 드라이브에서 지운 폴더는 목록에서 뺀다(파일은 그대로 둠).

실행: python3 tools/class-sync.py   (pymupdf 필요)
"""
import datetime, hashlib, json, os, shutil, sys, unicodedata
import pymupdf

N = lambda s: unicodedata.normalize('NFC', s)
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'class')
CLOUD = os.path.expanduser('~/Library/CloudStorage')


def find_drive_folder():
    for acc in os.listdir(CLOUD):
        if not acc.startswith('GoogleDrive-'):
            continue
        base = os.path.join(CLOUD, acc)
        for my in os.listdir(base):
            if N(my) != '내 드라이브':
                continue
            for f in os.listdir(os.path.join(base, my)):
                if N(f) == 'class 자료실':
                    return os.path.join(base, my, f)
    sys.exit('드라이브에서 「class 자료실」 폴더를 찾지 못했습니다.')


def digest(path):
    h = hashlib.sha1()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()[:12]


def render(pdf, out):
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        if f.endswith('.jpg'):
            os.remove(os.path.join(out, f))
    d = pymupdf.open(pdf)
    for i, p in enumerate(d):
        p.get_pixmap(dpi=110).save(os.path.join(out, f'p{i + 1:02d}.jpg'), jpg_quality=72)
        p.get_pixmap(dpi=36).save(os.path.join(out, f't{i + 1:02d}.jpg'), jpg_quality=70)
    shutil.copy2(pdf, os.path.join(out, 'file.pdf'))
    return d.page_count


def main():
    root = find_drive_folder()
    jpath = os.path.join(SITE, 'books.json')
    data = json.load(open(jpath, encoding='utf-8'))
    books = {b.get('folder'): b for b in data['books']}
    seen, changed = set(), []

    for folder in sorted(os.listdir(root)):
        fdir = os.path.join(root, folder)
        if folder.startswith('.') or not os.path.isdir(fdir):
            continue
        pdfs = [f for f in os.listdir(fdir) if f.lower().endswith('.pdf')]
        if not pdfs:
            continue
        name = N(folder)
        seen.add(name)
        pdf = os.path.join(fdir, sorted(pdfs)[-1])  # 버전 이름이면 가장 뒤 것
        h = digest(pdf)
        b = books.get(name)
        if b and b.get('hash') == h:
            continue
        kind, title = (name.split(' · ', 1) if ' · ' in name else ('학습지', name))
        if not b:
            no = max([x['no'] for x in data['books']] + [0]) + 1
            b = {'slug': f'book-{no:02d}', 'no': no, 'folder': name, 'kind': kind, 'title': title,
                 'kicker': '', 'sub': '', 'date': datetime.date.today().isoformat()}
            data['books'].append(b)
        out = os.path.join(SITE, 'books', b['slug'])
        b.update(pages=render(pdf, out), file=f"books/{b['slug']}/file.pdf",
                 fileName=N(os.path.basename(pdf)), size=os.path.getsize(pdf), hash=h,
                 date=datetime.date.today().isoformat())
        changed.append(b['title'])

    gone = [b['title'] for b in data['books'] if b.get('folder') not in seen]
    data['books'] = [b for b in data['books'] if b.get('folder') in seen]
    json.dump(data, open(jpath, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print('새로 넣거나 바꿈:', ', '.join(changed) or '없음')
    print('목록에서 뺌:', ', '.join(gone) or '없음')


if __name__ == '__main__':
    main()
