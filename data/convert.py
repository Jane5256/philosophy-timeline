#!/usr/bin/env python3
"""
MD → JSON 转换脚本
用法：python3 convert.py
会读取 structured/ 目录下的 .md 文件，生成对应的 .json 文件。

数据来源（西方 + 东方，合并为同一份 JSON）：
  philosophers.json ← philosophers.md + philosophers-east.md
  schools.json      ← schools.md + schools-east.md
  events.json       ← events.md (+ events-east.md，若存在)

每条记录含 region 字段（west / east），.md 中用「- 地区：east」标注，缺省为 west。
eras.json 为手工维护，不经此脚本生成。
"""

import re
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent / "structured"


def parse_year(s: str) -> tuple[int, bool]:
    """解析年份字符串，返回 (年份整数, 是否近似)"""
    s = s.strip()
    approx = s.startswith("约")
    s = s.replace("约", "").strip()
    # 支持 "-427" 或 "前 427" 或 "前427"
    s = s.replace("前 ", "-").replace("前", "-").replace(" ", "")
    try:
        return int(s), approx
    except ValueError:
        return 0, True


def slugify(name: str) -> str:
    """中文姓名转 slug（用于 id）"""
    # 常用哲学家名的英文 slug 映射
    mapping = {
        # —— 西方 ——
        "泰勒斯": "thales",
        "阿那克西曼德": "anaximander",
        "阿那克西美尼": "anaximenes",
        "毕达哥拉斯": "pythagoras",
        "赫拉克利特": "heraclitus",
        "克塞诺芬尼": "xenophanes",
        "巴门尼德": "parmenides",
        "芝诺（爱利亚）": "zeno-of-elea",
        "留基伯": "leucippus",
        "德谟克利特": "democritus",
        "苏格拉底": "socrates",
        "柏拉图": "plato",
        "亚里士多德": "aristotle",
        "伊壁鸠鲁": "epicurus",
        "卢克莱修": "lucretius",
        "使徒保罗": "paul-the-apostle",
        "奥古斯丁": "augustine",
        "托马斯·阿奎纳": "thomas-aquinas",
        "但丁·阿利吉耶里": "dante-alighieri",
        "弗兰齐斯科·彼特拉克": "petrarca",
        "尼古拉·哥白尼": "copernicus",
        "约翰尼斯·开普勒": "kepler",
        "伽利略·伽利雷": "galileo",
        "威廉·莎士比亚": "shakespeare",
        "马丁·路德": "martin-luther",
        "勒内·笛卡尔": "descartes",
        "巴鲁赫·斯宾诺莎": "spinoza",
        "戈特弗里德·威廉·莱布尼茨": "leibniz",
        "乔万尼·薄伽丘": "boccaccio",
        "列奥纳多·达·芬奇": "leonardo-da-vinci",
        "塞涅卡": "seneca",
        "爱比克泰德": "epictetus",
        "马可·奥勒留": "marcus-aurelius",
        "波爱修斯": "boethius",
        "阿维森纳": "avicenna",
        "阿威罗伊": "averroes",
        "安瑟伦": "anselm",
        "威廉·奥卡姆": "ockham",
        "杰里米·边沁": "bentham",
        "约翰·斯图尔特·密尔": "mill",
        "约翰·洛克": "john-locke",
        "大卫·休谟": "david-hume",
        "托马斯·霍布斯": "thomas-hobbes",
        "伊曼努尔·康德": "kant",
        "格奥尔格·威廉·弗里德里希·黑格尔": "hegel",
        "约翰·戈特利布·费希特": "fichte",
        "弗里德里希·谢林": "schelling",
        "亚瑟·叔本华": "schopenhauer",
        "弗里德里希·威廉·尼采": "nietzsche",
        "卡尔·马克思": "karl-marx",
        "弗里德里希·恩格斯": "friedrich-engels",
        "伯特兰·罗素": "russell",
        "路德维希·维特根斯坦": "wittgenstein",
        "索伦·克尔凯郭尔": "kierkegaard",
        "让-保罗·萨特": "sartre",
        "西蒙娜·德·波伏娃": "de-beauvoir",
        "阿尔贝·加缪": "camus",
        # 新增（公元前 200 年前补录）
        "普罗泰戈拉": "protagoras",
        "高尔吉亚": "gorgias",
        "安提西尼": "antisthenes",
        "第欧根尼": "diogenes",
        "皮浪": "pyrrho",
        "芝诺（季蒂昂）": "zeno-of-citium",
        "克吕西波": "chrysippus",
        "阿那克萨戈拉": "anaxagoras",
        "恩培多克勒": "empedocles",
        "荷马": "homer",
        "赫西俄德": "hesiod",
        "希罗多德": "herodotus",
        "修昔底德": "thucydides",
        # —— 东方 ——
        "孔子": "confucius",
        "孟子": "mencius",
        "荀子": "xunzi",
        "老子": "laozi",
        "庄子": "zhuangzi",
        "墨子": "mozi",
        "韩非": "han-fei",
        "商鞅": "shang-yang",
        "惠施": "hui-shi",
        "公孙龙": "gongsun-long",
        "邹衍": "zou-yan",
        "孙武": "sun-tzu",
        "董仲舒": "dong-zhongshu",
        "王充": "wang-chong",
        "王弼": "wang-bi",
        "郭象": "guo-xiang",
        "嵇康": "ji-kang",
        "慧能": "huineng",
        "周敦颐": "zhou-dunyi",
        "张载": "zhang-zai",
        "程颢": "cheng-hao",
        "程颐": "cheng-yi",
        "朱熹": "zhu-xi",
        "陆九渊": "lu-jiuyuan",
        "王阳明": "wang-yangming",
        "黄宗羲": "huang-zongxi",
        "顾炎武": "gu-yanwu",
        "王夫之": "wang-fuzhi",
        "戴震": "dai-zhen",
        "龚自珍": "gong-zizhen",
        "康有为": "kang-youwei",
        "梁启超": "liang-qichao",
        "严复": "yan-fu",
        "胡适": "hu-shi",
        "梁漱溟": "liang-shuming",
        "熊十力": "xiong-shili",
        "冯友兰": "feng-youlan",
        # 新增（公元前 200 年前补录）
        "鬼谷子": "guiguzi",
        "苏秦": "su-qin",
        "张仪": "zhang-yi",
        "杨朱": "yang-zhu",
        "列子": "liezi",
        "曾子": "zengzi",
        "子思": "zisi",
        "李悝": "li-kui",
        "吴起": "wu-qi",
        "孙膑": "sun-bin",
        "周文王": "king-wen",
        "姜子牙": "jiang-ziya",
    }
    return mapping.get(name, name.lower().replace("·", "-").replace(" ", "-"))


SCHOOL_ID_MAP = {
    # —— 西方 ——
    "米利都学派": "milesian",
    "毕达哥拉斯学派": "pythagorean",
    "爱菲斯学派": "ephesian",
    "爱利亚学派": "eleatic",
    "古典原子论": "atomist",
    "希腊三杰": "greek-classical",
    "伊壁鸠鲁学派": "epicurean",
    "教父哲学": "patristic",
    "经院哲学": "scholasticism",
    "文艺复兴": "renaissance",
    "宗教改革": "reformation",
    "科学革命": "scientific-revolution",
    "理性主义": "rationalism",
    "经验主义": "empiricism",
    "机械唯物主义": "mechanical-materialism",
    "德国古典哲学": "german-idealism",
    "唯意志论": "voluntarism",
    "辩证唯物主义": "dialectical-materialism",
    "分析哲学": "analytic-philosophy",
    "存在主义": "existentialism",
    "荒诞哲学": "absurdism",
    "斯多葛学派": "stoicism",
    "伊斯兰哲学": "islamic-philosophy",
    "功利主义": "utilitarianism",
    # 新增（公元前 200 年前补录）
    "多元论": "pluralism",
    "智者派": "sophism",
    "犬儒学派": "cynicism",
    "怀疑主义": "skepticism",
    "史诗与神话": "epic-myth",
    "古典史学": "classical-historiography",
    # —— 东方 ——
    "儒家": "confucianism",
    "道家": "daoism",
    "墨家": "mohism",
    "法家": "legalism",
    "名家": "school-of-names",
    "阴阳家": "yin-yang-school",
    "兵家": "military-school",
    "两汉经学": "han-confucianism",
    "魏晋玄学": "xuanxue",
    "禅宗": "chan-buddhism",
    "宋明理学": "neo-confucianism",
    "陆王心学": "lu-wang-school",
    "明清实学": "practical-learning",
    "近代启蒙": "enlightenment-china",
    "现代新儒家": "new-confucianism",
    # 新增（公元前 200 年前补录）
    "纵横家": "school-of-diplomacy",
    "上古经典": "ancient-classics",
}


def parse_philosophers(md_path: Path) -> list[dict]:
    text = md_path.read_text(encoding="utf-8")
    # 按 "---" 分割，跳过首部说明
    blocks = re.split(r"\n---\n", text)
    result = []

    for block in blocks:
        block = block.strip()
        if not block or block.startswith("#") and "哲学家数据" in block:
            continue

        # 提取 ## 标题（姓名）
        name_match = re.search(r"^## (.+)$", block, re.MULTILINE)
        if not name_match:
            continue
        name = name_match.group(1).strip()

        def get_field(key):
            m = re.search(rf"^- {key}：(.*)$", block, re.MULTILINE)
            return m.group(1).strip() if m else ""

        # 解析基本字段
        name_en = get_field("英文名")
        born_str = get_field("生")
        died_str = get_field("卒")
        nationality = get_field("国籍")
        p_type = get_field("类型")
        school_str = get_field("流派")
        era = get_field("时代")
        region = get_field("地区") or "west"

        born, born_approx = parse_year(born_str) if born_str else (0, True)
        died, died_approx = parse_year(died_str) if died_str else (0, True)

        schools = [s.strip() for s in school_str.split(",") if s.strip()]

        # 简介
        summary_m = re.search(r"### 简介\n(.+?)(?=\n###|\Z)", block, re.DOTALL)
        summary = summary_m.group(1).strip() if summary_m else ""

        # 核心思想（列表）
        ideas_m = re.search(r"### 核心思想\n(.+?)(?=\n###|\Z)", block, re.DOTALL)
        core_ideas = []
        if ideas_m:
            for line in ideas_m.group(1).strip().splitlines():
                line = line.strip()
                if line.startswith("- "):
                    core_ideas.append(line[2:])

        # 代表作
        works_m = re.search(r"### 代表作\n(.+?)(?=\n###|\Z)", block, re.DOTALL)
        major_works = []
        if works_m:
            for line in works_m.group(1).strip().splitlines():
                line = line.strip()
                if not line.startswith("- ") or line == "- （无传世著作）" or "无传世" in line or "无著作" in line:
                    continue
                line = line[2:]
                # 跳过散佚/无传世说明（括号开头的注释行）
                if line.startswith("（"):
                    continue
                # 格式：书名 (英文名, 年份) 或 书名 (英文名)
                work_match = re.match(r"(.+?)\s*\((.+?)(?:,\s*(.+?))?\)$", line)
                if work_match:
                    t = work_match.group(1).strip()
                    t_en = work_match.group(2).strip()
                    yr_str = work_match.group(3)
                    yr = None
                    if yr_str:
                        yr_str = yr_str.replace("约", "").replace("年", "").strip()
                        yr_str = yr_str.replace("前 ", "-").replace("前", "-")
                        try:
                            yr = int(yr_str)
                        except ValueError:
                            yr = None
                    major_works.append({"title": t, "titleEn": t_en, "year": yr})
                else:
                    major_works.append({"title": line, "titleEn": "", "year": None})

        # 名言
        quote_m = re.search(r"### 名言\n(.+?)(?=\n###|\Z)", block, re.DOTALL)
        quote = quote_m.group(1).strip() if quote_m else ""

        philosopher = {
            "id": slugify(name),
            "name": name,
            "nameEn": name_en,
            "born": born,
            "died": died,
            "bornApprox": born_approx,
            "diedApprox": died_approx,
            "nationality": nationality,
            "type": p_type,
            "school": schools,
            "era": era,
            "region": region,
            "portrait": {
                "url": "",
                "source": "Wikipedia",
                "license": "Public Domain"
            },
            "summary": summary[:80] if summary else "",
            "coreIdeas": core_ideas,
            "majorWorks": major_works,
            "historicalNote": "",
            "quote": quote,
            "quoteEn": ""
        }
        result.append(philosopher)

    return result


def parse_schools(md_path: Path) -> list[dict]:
    text = md_path.read_text(encoding="utf-8")
    blocks = re.split(r"\n---\n", text)
    result = []

    for block in blocks:
        block = block.strip()
        if not block or "哲学流派数据" in block:
            continue

        name_match = re.search(r"^## (.+)$", block, re.MULTILINE)
        if not name_match:
            continue
        name = name_match.group(1).strip()

        def get_field(key):
            m = re.search(rf"^- {key}：(.*)$", block, re.MULTILINE)
            return m.group(1).strip() if m else ""

        name_en = get_field("英文名")
        alternate = get_field("别名")
        era = get_field("时代")
        start_str = get_field("起始年")
        end_str = get_field("结束年")
        color = get_field("颜色")
        reps_str = get_field("代表哲学家")
        region = get_field("地区") or "west"

        start = int(start_str.replace("约", "").replace("前 ", "-").replace("前", "-").strip()) if start_str else 0
        end = int(end_str.replace("约", "").replace("前 ", "-").replace("前", "-").strip()) if end_str else 0

        reps = [r.strip() for r in reps_str.split(",") if r.strip()]

        desc_m = re.search(r"### 简介\n(.+?)(?=\n###|\Z)", block, re.DOTALL)
        description = desc_m.group(1).strip() if desc_m else ""

        themes_m = re.search(r"### 核心主题\n(.+?)(?=\n###|\Z)", block, re.DOTALL)
        themes = []
        if themes_m:
            for line in themes_m.group(1).strip().splitlines():
                line = line.strip()
                if line.startswith("- "):
                    themes.append(line[2:])

        school = {
            "id": SCHOOL_ID_MAP.get(name, name.lower().replace(" ", "-")),
            "name": name,
            "nameEn": name_en,
            "alternateNames": [a.strip() for a in alternate.split("，") if a.strip()] if alternate else [],
            "era": era,
            "region": region,
            "start": start,
            "end": end,
            "color": color,
            "description": description,
            "coreThemes": themes,
            "representativePhilosophers": reps,
        }
        result.append(school)

    return result


def parse_events(md_path: Path) -> list[dict]:
    text = md_path.read_text(encoding="utf-8")
    blocks = re.split(r"\n---\n", text)
    result = []

    for block in blocks:
        block = block.strip()
        if not block or "历史背景事件数据" in block:
            continue

        name_match = re.search(r"^## (.+)$", block, re.MULTILINE)
        if not name_match:
            continue
        name = name_match.group(1).strip()

        def get_field(key):
            m = re.search(rf"^- {key}：(.*)$", block, re.MULTILINE)
            return m.group(1).strip() if m else ""

        year_str = get_field("年份")
        approx = year_str.startswith("约")
        year_str = year_str.replace("约 ", "").replace("约", "").strip()
        year_str = year_str.replace("前 ", "-").replace("前", "-")
        try:
            year = int(year_str)
        except ValueError:
            year = 0

        event_type = get_field("类型")
        region = get_field("地区")

        # 结束年（朝代等时间跨度型事件用；点事件留空 → null）
        end_str = get_field("结束年")
        if end_str:
            es = end_str.replace("约", "").replace("前 ", "-").replace("前", "-").strip()
            try:
                end_year = int(es)
            except ValueError:
                end_year = None
        else:
            end_year = None

        desc_m = re.search(r"^- 描述：(.+)$", block, re.MULTILINE)
        description = desc_m.group(1).strip() if desc_m else ""

        # 显式 id 优先，否则按名称生成
        explicit_id = get_field("id")
        event_id = explicit_id or name.lower().replace(" ", "-").replace("（", "").replace("）", "").replace("·", "-")

        event = {
            "id": event_id,
            "year": year,
            "endYear": end_year,
            "yearApprox": approx,
            "name": name,
            "nameEn": "",
            "type": event_type,
            "description": description,
            "region": region,
        }
        result.append(event)

    return result


def parse_synchronies(md_path: Path) -> list[dict]:
    """同期金句：每条含起止年区间 + 一句话文案"""
    text = md_path.read_text(encoding="utf-8")
    blocks = re.split(r"\n---\n", text)
    result = []

    for block in blocks:
        block = block.strip()
        if not block or "同期金句数据" in block:
            continue

        name_match = re.search(r"^## (.+)$", block, re.MULTILINE)
        if not name_match:
            continue

        def get_field(key):
            m = re.search(rf"^- {key}：(.*)$", block, re.MULTILINE)
            return m.group(1).strip() if m else ""

        text_val = get_field("文案")
        if not text_val:
            continue
        start, _ = parse_year(get_field("起始年"))
        end, _ = parse_year(get_field("结束年"))

        result.append({
            "start": start,
            "end": end,
            "text": text_val,
        })

    return result


def convert(name: str, parser, sources: list[str]):
    """对一组源 .md 文件解析并合并，写出单个 .json"""
    merged = []
    used = []
    for fname in sources:
        path = DATA_DIR / fname
        if path.exists():
            merged.extend(parser(path))
            used.append(fname)
    if used:
        out = DATA_DIR / f"{name}.json"
        out.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✅ {name}.json — 共 {len(merged)} 条（来源：{', '.join(used)}）")
    else:
        print(f"⚠️  {name} 的源 .md 未找到")


def main():
    print("开始转换 MD → JSON...\n")

    # 哲学家：解析合并后注入肖像 URL（来自 portraits.json，单独维护）
    portraits = {}
    pf = DATA_DIR / "portraits.json"
    if pf.exists():
        portraits = json.loads(pf.read_text(encoding="utf-8"))
    focus = {}
    ff = DATA_DIR / "portrait-focus.json"
    if ff.exists():
        focus = json.loads(ff.read_text(encoding="utf-8"))
    phil = []
    used = []
    for fname in ["philosophers.md", "philosophers-east.md"]:
        path = DATA_DIR / fname
        if path.exists():
            phil.extend(parse_philosophers(path))
            used.append(fname)
    for p in phil:
        if portraits.get(p["id"]):
            p["portrait"]["url"] = portraits[p["id"]]
        if focus.get(p["id"]):
            p["portrait"]["focus"] = focus[p["id"]]
    (DATA_DIR / "philosophers.json").write_text(
        json.dumps(phil, ensure_ascii=False, indent=2), encoding="utf-8")
    n_img = sum(1 for p in phil if p["portrait"]["url"])
    print(f"✅ philosophers.json — 共 {len(phil)} 条（来源：{', '.join(used)}；已注入肖像 {n_img}）")

    convert("schools", parse_schools,
            ["schools.md", "schools-east.md"])
    convert("events", parse_events,
            ["events.md", "events-east.md"])
    convert("synchronies", parse_synchronies,
            ["synchronies.md"])

    print("\n转换完成！JSON 文件已保存到 structured/ 目录。")
    print("（注：eras.json 为手工维护，不由本脚本生成。）")


if __name__ == "__main__":
    main()
