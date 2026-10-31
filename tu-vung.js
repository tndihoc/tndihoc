
  /*
    Cấu trúc dữ liệu JSON cho flashcard.
    Mỗi từ là một object với 3 khoá: hanzi (chữ Hán), pinyin (phiên âm), mean (nghĩa).
    Muốn thay bộ từ mặc định, chỉ cần sửa nội dung mảng customDeck bên dưới rồi lưu file.
    Ví dụ:
    const customDeck = [
      { hanzi: "你好", pinyin: "nǐ hǎo", mean: "xin chào" },
      { hanzi: "谢谢", pinyin: "xièxiè", mean: "cảm ơn" }
    ];
  */
  const hsk1Deck = [
    {"hanzi": "爱", "pinyin": "ài", "mean": "yêu"},
    {"hanzi": "八", "pinyin": "bā", "mean": "tám"},
    {"hanzi": "爸爸", "pinyin": "bàba", "mean": "bố"},
    {"hanzi": "杯子", "pinyin": "bēizi", "mean": "cốc"},
    {"hanzi": "北京", "pinyin": "Běijīng", "mean": "Bắc Kinh"},
    {"hanzi": "本", "pinyin": "běn", "mean": "cuốn (dùng cho sách)"},
    {"hanzi": "不客气", "pinyin": "bú kèqì", "mean": "không có gì (đáp lại lời cảm ơn)"},
    {"hanzi": "不", "pinyin": "bù", "mean": "không"},
    {"hanzi": "菜", "pinyin": "cài", "mean": "món ăn, rau củ"},
    {"hanzi": "茶", "pinyin": "chá", "mean": "trà"},
    {"hanzi": "吃", "pinyin": "chī", "mean": "ăn"},
    {"hanzi": "出租车", "pinyin": "chūzūchē", "mean": "taxi"},
    {"hanzi": "打电话", "pinyin": "dǎ diànhuà", "mean": "gọi điện thoại"},
    {"hanzi": "大", "pinyin": "dà", "mean": "lớn, to"},
    {"hanzi": "的", "pinyin": "de", "mean": "của (thuộc tính)"},
    {"hanzi": "点", "pinyin": "diǎn", "mean": "giờ (trong thời gian)"},
    {"hanzi": "电脑", "pinyin": "diànnǎo", "mean": "máy tính"},
    {"hanzi": "电视", "pinyin": "diànshì", "mean": "ti vi"},
    {"hanzi": "电影", "pinyin": "diànyǐng", "mean": "phim"},
    {"hanzi": "东西", "pinyin": "dōngxī", "mean": "đồ vật, thứ"},
    {"hanzi": "都", "pinyin": "dōu", "mean": "đều"},
    {"hanzi": "读", "pinyin": "dú", "mean": "đọc"},
    {"hanzi": "对不起", "pinyin": "duìbùqǐ", "mean": "xin lỗi"},
    {"hanzi": "多", "pinyin": "duō", "mean": "nhiều"},
    {"hanzi": "多少", "pinyin": "duōshǎo", "mean": "bao nhiêu"},
    {"hanzi": "儿子", "pinyin": "érzi", "mean": "con trai"},
    {"hanzi": "二", "pinyin": "èr", "mean": "hai"},
    {"hanzi": "饭馆", "pinyin": "fànguǎn", "mean": "nhà hàng"},
    {"hanzi": "飞机", "pinyin": "fēijī", "mean": "máy bay"},
    {"hanzi": "分钟", "pinyin": "fēnzhōng", "mean": "phút"},
    {"hanzi": "高兴", "pinyin": "gāoxìng", "mean": "vui"},
    {"hanzi": "个", "pinyin": "gè", "mean": "cái (đơn vị lượng từ)"},
    {"hanzi": "工作", "pinyin": "gōngzuò", "mean": "công việc"},
    {"hanzi": "狗", "pinyin": "gǒu", "mean": "chó"},
    {"hanzi": "汉语", "pinyin": "Hànyǔ", "mean": "tiếng Hán"},
    {"hanzi": "好", "pinyin": "hǎo", "mean": "tốt, khỏe"},
    {"hanzi": "喝", "pinyin": "hē", "mean": "uống"},
    {"hanzi": "和", "pinyin": "hé", "mean": "và"},
    {"hanzi": "很", "pinyin": "hěn", "mean": "rất"},
    {"hanzi": "后面", "pinyin": "hòumiàn", "mean": "phía sau"},
    {"hanzi": "回", "pinyin": "huí", "mean": "quay lại, về"},
    {"hanzi": "会", "pinyin": "huì", "mean": "sẽ, biết (kỹ năng)"},
    {"hanzi": "火车站", "pinyin": "huǒchēzhàn", "mean": "ga tàu"},
    {"hanzi": "几", "pinyin": "jǐ", "mean": "mấy"},
    {"hanzi": "家", "pinyin": "jiā", "mean": "gia đình, nhà"},
    {"hanzi": "叫", "pinyin": "jiào", "mean": "gọi, tên gọi"},
    {"hanzi": "今天", "pinyin": "jīntiān", "mean": "hôm nay"},
    {"hanzi": "九", "pinyin": "jiǔ", "mean": "chín"},
    {"hanzi": "开", "pinyin": "kāi", "mean": "mở, khởi động"},
    {"hanzi": "看", "pinyin": "kàn", "mean": "xem"},
    {"hanzi": "看见", "pinyin": "kànjiàn", "mean": "nhìn thấy"},
    {"hanzi": "块", "pinyin": "kuài", "mean": "miếng, đồng (tiền)"},
    {"hanzi": "来", "pinyin": "lái", "mean": "đến"},
    {"hanzi": "老师", "pinyin": "lǎoshī", "mean": "giáo viên"},
    {"hanzi": "了", "pinyin": "le", "mean": "đã (dùng để chỉ sự thay đổi)"},
    {"hanzi": "冷", "pinyin": "lěng", "mean": "lạnh"},
    {"hanzi": "里", "pinyin": "lǐ", "mean": "trong"},
    {"hanzi": "零", "pinyin": "líng", "mean": "không (số 0)"},
    {"hanzi": "六", "pinyin": "liù", "mean": "sáu"},
    {"hanzi": "妈妈", "pinyin": "māma", "mean": "mẹ"},
    {"hanzi": "吗", "pinyin": "ma", "mean": "không (dùng trong câu hỏi)"},
    {"hanzi": "买", "pinyin": "mǎi", "mean": "mua"},
    {"hanzi": "猫", "pinyin": "māo", "mean": "mèo"},
    {"hanzi": "没", "pinyin": "méi", "mean": "không có, chưa"},
    {"hanzi": "没关系", "pinyin": "méi guānxi", "mean": "không sao, không có gì"},
    {"hanzi": "米饭", "pinyin": "mǐfàn", "mean": "cơm"},
    {"hanzi": "明天", "pinyin": "míngtiān", "mean": "ngày mai"},
    {"hanzi": "名字", "pinyin": "míngzi", "mean": "tên"},
    {"hanzi": "哪里 (哪儿)", "pinyin": "nǎlǐ (nǎr)", "mean": "đâu, chỗ nào"},
    {"hanzi": "那", "pinyin": "nà", "mean": "đó, kia"},
    {"hanzi": "呢", "pinyin": "ne", "mean": "thì sao? (dùng để hỏi thêm)"},
    {"hanzi": "能", "pinyin": "néng", "mean": "có thể"},
    {"hanzi": "你", "pinyin": "nǐ", "mean": "bạn"},
    {"hanzi": "年", "pinyin": "nián", "mean": "năm"},
    {"hanzi": "女儿", "pinyin": "nǚ'ér", "mean": "con gái"},
    {"hanzi": "朋友", "pinyin": "péngyou", "mean": "bạn"},
    {"hanzi": "漂亮", "pinyin": "piàoliang", "mean": "đẹp"},
    {"hanzi": "苹果", "pinyin": "píngguǒ", "mean": "táo"},
    {"hanzi": "七", "pinyin": "qī", "mean": "bảy"},
    {"hanzi": "钱", "pinyin": "qián", "mean": "tiền"},
    {"hanzi": "前面", "pinyin": "qiánmiàn", "mean": "phía trước"},
    {"hanzi": "请", "pinyin": "qǐng", "mean": "xin vui lòng, mời"},
    {"hanzi": "去", "pinyin": "qù", "mean": "đi"},
    {"hanzi": "热", "pinyin": "rè", "mean": "nóng"},
    {"hanzi": "人", "pinyin": "rén", "mean": "người"},
    {"hanzi": "认识", "pinyin": "rènshi", "mean": "quen biết"},
    {"hanzi": "日", "pinyin": "rì", "mean": "ngày"},
    {"hanzi": "三", "pinyin": "sān", "mean": "ba"},
    {"hanzi": "商店", "pinyin": "shāngdiàn", "mean": "cửa hàng"},
    {"hanzi": "上", "pinyin": "shàng", "mean": "lên"},
    {"hanzi": "上午", "pinyin": "shàngwǔ", "mean": "buổi sáng"},
    {"hanzi": "少", "pinyin": "shǎo", "mean": "ít"},
    {"hanzi": "谁", "pinyin": "shuí/ shéi", "mean": "ai"},
    {"hanzi": "什么", "pinyin": "shénme", "mean": "cái gì"},
    {"hanzi": "十", "pinyin": "shí", "mean": "mười"},
    {"hanzi": "时候", "pinyin": "shíhòu", "mean": "lúc, khi"},
    {"hanzi": "是", "pinyin": "shì", "mean": "là, thì"},
    {"hanzi": "书", "pinyin": "shū", "mean": "sách"},
    {"hanzi": "水", "pinyin": "shuǐ", "mean": "nước"},
    {"hanzi": "水果", "pinyin": "shuǐguǒ", "mean": "trái cây"},
    {"hanzi": "睡觉", "pinyin": "shuìjiào", "mean": "ngủ"},
    {"hanzi": "说话", "pinyin": "shuōhuà", "mean": "nói chuyện"},
    {"hanzi": "四", "pinyin": "sì", "mean": "bốn"},
    {"hanzi": "岁", "pinyin": "suì", "mean": "tuổi"},
    {"hanzi": "他", "pinyin": "tā", "mean": "anh ấy, ông ấy"},
    {"hanzi": "她", "pinyin": "tā", "mean": "cô ấy, bà ấy"},
    {"hanzi": "太", "pinyin": "tài", "mean": "quá"},
    {"hanzi": "天气", "pinyin": "tiānqì", "mean": "thời tiết"},
    {"hanzi": "听", "pinyin": "tīng", "mean": "nghe"},
    {"hanzi": "同学", "pinyin": "tóngxué", "mean": "bạn học"},
    {"hanzi": "喂", "pinyin": "wèi", "mean": "alo"},
    {"hanzi": "我", "pinyin": "wǒ", "mean": "tôi"},
    {"hanzi": "我们", "pinyin": "wǒmen", "mean": "chúng tôi"},
    {"hanzi": "五", "pinyin": "wǔ", "mean": "năm"},
    {"hanzi": "喜欢", "pinyin": "xǐhuān", "mean": "thích"},
    {"hanzi": "下", "pinyin": "xià", "mean": "xuống"},
    {"hanzi": "下午", "pinyin": "xiàwǔ", "mean": "buổi chiều"},
    {"hanzi": "下雨", "pinyin": "xià yǔ", "mean": "mưa"},
    {"hanzi": "先生", "pinyin": "xiānshēng", "mean": "ông, ngài"},
    {"hanzi": "现在", "pinyin": "xiànzài", "mean": "bây giờ"},
    {"hanzi": "想", "pinyin": "xiǎng", "mean": "nghĩ, muốn"},
    {"hanzi": "小", "pinyin": "xiǎo", "mean": "nhỏ"},
    {"hanzi": "小姐", "pinyin": "xiǎojiě", "mean": "cô (trong cách gọi)"},
    {"hanzi": "些", "pinyin": "xiē", "mean": "vài"},
    {"hanzi": "写", "pinyin": "xiě", "mean": "viết"},
    {"hanzi": "谢谢", "pinyin": "xièxiè", "mean": "cảm ơn"},
    {"hanzi": "星期", "pinyin": "xīngqī", "mean": "tuần"},
    {"hanzi": "学生", "pinyin": "xuéshēng", "mean": "học sinh"},
    {"hanzi": "学习", "pinyin": "xuéxí", "mean": "học tập"},
    {"hanzi": "学校", "pinyin": "xuéxiào", "mean": "trường học"},
    {"hanzi": "一", "pinyin": "yī", "mean": "một"},
    {"hanzi": "衣服", "pinyin": "yīfu", "mean": "quần áo"},
    {"hanzi": "医生", "pinyin": "yīshēng", "mean": "bác sĩ"},
    {"hanzi": "医院", "pinyin": "yīyuàn", "mean": "bệnh viện"},
    {"hanzi": "椅子", "pinyin": "yǐzi", "mean": "ghế"},
    {"hanzi": "月", "pinyin": "yuè", "mean": "tháng, mặt trăng"},
    {"hanzi": "在", "pinyin": "zài", "mean": "ở, tại"},
    {"hanzi": "再见", "pinyin": "zàijiàn", "mean": "tạm biệt"},
    {"hanzi": "怎么", "pinyin": "zěnme", "mean": "làm sao"},
    {"hanzi": "怎么样", "pinyin": "zěnmeyàng", "mean": "như thế nào"},
    {"hanzi": "这", "pinyin": "zhè", "mean": "Đây, này"},
    {"hanzi": "中国", "pinyin": "Zhōngguó", "mean": "Trung Quốc"},
    {"hanzi": "中午", "pinyin": "zhōngwǔ", "mean": "buổi trưa"},
    {"hanzi": "住", "pinyin": "zhù", "mean": "sống, cư trú"},
    {"hanzi": "桌子", "pinyin": "zhuōzi", "mean": "bàn"},
    {"hanzi": "字", "pinyin": "zì", "mean": "chữ"},
    {"hanzi": "昨天", "pinyin": "zuótiān", "mean": "hôm qua"},
    {"hanzi": "坐", "pinyin": "zuò", "mean": "ngồi"},
    {"hanzi": "做", "pinyin": "zuò", "mean": "làm"},
  ];

  const hsk2Deck = [
    {"hanzi": "吧", "pinyin": "ba", "mean": "đi, nhé, nhỉ (đứng cuối câu)"},
    {"hanzi": "白", "pinyin": "bái", "mean": "trắng"},
    {"hanzi": "百", "pinyin": "bǎi", "mean": "trăm"},
    {"hanzi": "帮助", "pinyin": "bāngzhù", "mean": "giúp đỡ"},
    {"hanzi": "报纸", "pinyin": "bàozhǐ", "mean": "báo"},
    {"hanzi": "比", "pinyin": "bǐ", "mean": "so sánh"},
    {"hanzi": "别", "pinyin": "bié", "mean": "đừng, khác biệt"},
    {"hanzi": "长", "pinyin": "cháng", "mean": "dài"},
    {"hanzi": "唱歌", "pinyin": "chànggē", "mean": "hát"},
    {"hanzi": "出", "pinyin": "chū", "mean": "ra ngoài"},
    {"hanzi": "穿", "pinyin": "chuān", "mean": "mặc"},
    {"hanzi": "船", "pinyin": "chuán", "mean": "thuyền"},
    {"hanzi": "次", "pinyin": "cì", "mean": "lần"},
    {"hanzi": "从", "pinyin": "cóng", "mean": "từ, theo"},
    {"hanzi": "错", "pinyin": "cuò", "mean": "sai"},
    {"hanzi": "打篮球", "pinyin": "dǎ lánqiú", "mean": "chơi bóng rổ"},
    {"hanzi": "大家", "pinyin": "dàjiā", "mean": "mọi người"},
    {"hanzi": "但是", "pinyin": "dànshì", "mean": "nhưng"},
    {"hanzi": "到", "pinyin": "dào", "mean": "đến"},
    {"hanzi": "得", "pinyin": "děi", "mean": "phải, đạt được"},
    {"hanzi": "等", "pinyin": "děng", "mean": "đợi"},
    {"hanzi": "弟弟", "pinyin": "dìdì", "mean": "em trai"},
    {"hanzi": "第一", "pinyin": "dì yī", "mean": "đầu tiên"},
    {"hanzi": "懂", "pinyin": "dǒng", "mean": "hiểu"},
    {"hanzi": "对", "pinyin": "duì", "mean": "đúng, đối với"},
    {"hanzi": "房间", "pinyin": "fángjiān", "mean": "phòng"},
    {"hanzi": "非常", "pinyin": "fēicháng", "mean": "rất, cực kỳ"},
    {"hanzi": "服务员", "pinyin": "fúwùyuán", "mean": "nhân viên phục vụ"},
    {"hanzi": "高", "pinyin": "gāo", "mean": "cao"},
    {"hanzi": "告诉", "pinyin": "gàosù", "mean": "nói cho, thông báo"},
    {"hanzi": "哥哥", "pinyin": "gēge", "mean": "anh trai"},
    {"hanzi": "给", "pinyin": "gěi", "mean": "đưa cho, cho"},
    {"hanzi": "公共汽车", "pinyin": "gōnggòng qìchē", "mean": "xe buýt"},
    {"hanzi": "公斤", "pinyin": "gōngjīn", "mean": "kilogram (kg)"},
    {"hanzi": "公司", "pinyin": "gōngsī", "mean": "công ty"},
    {"hanzi": "贵", "pinyin": "guì", "mean": "đắt, quý"},
    {"hanzi": "过", "pinyin": "guò", "mean": "qua, đi qua"},
    {"hanzi": "还", "pinyin": "hái", "mean": "vẫn, còn"},
    {"hanzi": "孩子", "pinyin": "háizi", "mean": "trẻ con"},
    {"hanzi": "好吃", "pinyin": "hǎochī", "mean": "ngon"},
    {"hanzi": "号", "pinyin": "hào", "mean": "số (như số điện thoại, số nhà)"},
    {"hanzi": "黑", "pinyin": "hēi", "mean": "đen"},
    {"hanzi": "红", "pinyin": "hóng", "mean": "đỏ"},
    {"hanzi": "欢迎", "pinyin": "huānyíng", "mean": "hoan nghênh, chào mừng"},
    {"hanzi": "回答", "pinyin": "huídá", "mean": "trả lời"},
    {"hanzi": "机场", "pinyin": "jīchǎng", "mean": "sân bay"},
    {"hanzi": "鸡蛋", "pinyin": "jīdàn", "mean": "trứng gà"},
    {"hanzi": "件", "pinyin": "jiàn", "mean": "cái (dùng cho sự việc, quần áo)"},
    {"hanzi": "教室", "pinyin": "jiàoshì", "mean": "lớp học"},
    {"hanzi": "姐姐", "pinyin": "jiějie", "mean": "chị gái"},
    {"hanzi": "介绍", "pinyin": "jièshào", "mean": "giới thiệu"},
    {"hanzi": "进", "pinyin": "jìn", "mean": "vào"},
    {"hanzi": "近", "pinyin": "jìn", "mean": "gần"},
    {"hanzi": "就", "pinyin": "jiù", "mean": "thì, ngay"},
    {"hanzi": "觉得", "pinyin": "juéde", "mean": "cảm thấy"},
    {"hanzi": "咖啡", "pinyin": "kāfēi", "mean": "cà phê"},
    {"hanzi": "开始", "pinyin": "kāishǐ", "mean": "bắt đầu"},
    {"hanzi": "考试", "pinyin": "kǎoshì", "mean": "thi"},
    {"hanzi": "可能", "pinyin": "kěnéng", "mean": "có thể"},
    {"hanzi": "可以", "pinyin": "kěyǐ", "mean": "có thể"},
    {"hanzi": "课", "pinyin": "kè", "mean": "bài học"},
    {"hanzi": "快", "pinyin": "kuài", "mean": "nhanh"},
    {"hanzi": "快乐", "pinyin": "kuàilè", "mean": "vui vẻ"},
    {"hanzi": "累", "pinyin": "lèi", "mean": "mệt"},
    {"hanzi": "离", "pinyin": "lí", "mean": "cách (khoảng cách), rời"},
    {"hanzi": "两", "pinyin": "liǎng", "mean": "hai (khi đếm số lượng)"},
    {"hanzi": "路", "pinyin": "lù", "mean": "đường"},
    {"hanzi": "旅游", "pinyin": "lǚyóu", "mean": "du lịch"},
    {"hanzi": "卖", "pinyin": "mài", "mean": "bán"},
    {"hanzi": "慢", "pinyin": "màn", "mean": "chậm"},
    {"hanzi": "忙", "pinyin": "máng", "mean": "bận"},
    {"hanzi": "每", "pinyin": "měi", "mean": "mỗi"},
    {"hanzi": "妹妹", "pinyin": "mèimei", "mean": "em gái"},
    {"hanzi": "门", "pinyin": "mén", "mean": "cửa"},
    {"hanzi": "男人", "pinyin": "nánrén", "mean": "đàn ông"},
    {"hanzi": "您", "pinyin": "nín", "mean": "bạn (dùng lịch sự)"},
    {"hanzi": "牛奶", "pinyin": "niúnǎi", "mean": "sữa bò"},
    {"hanzi": "女人", "pinyin": "nǚrén", "mean": "phụ nữ"},
    {"hanzi": "旁边", "pinyin": "pángbiān", "mean": "bên cạnh"},
    {"hanzi": "跑步", "pinyin": "pǎobù", "mean": "chạy bộ"},
    {"hanzi": "便宜", "pinyin": "piányí", "mean": "rẻ"},
    {"hanzi": "票", "pinyin": "piào", "mean": "vé"},
    {"hanzi": "妻子", "pinyin": "qīzi", "mean": "vợ"},
    {"hanzi": "起床", "pinyin": "qǐchuáng", "mean": "dậy (rời khỏi giường)"},
    {"hanzi": "千", "pinyin": "qiān", "mean": "nghìn"},
    {"hanzi": "晴", "pinyin": "qíng", "mean": "nắng, quang đãng"},
    {"hanzi": "去年", "pinyin": "qùnián", "mean": "năm ngoái"},
    {"hanzi": "让", "pinyin": "ràng", "mean": "để, làm cho, nhường"},
    {"hanzi": "上班", "pinyin": "shàngbān", "mean": "đi làm"},
    {"hanzi": "身体", "pinyin": "shēntǐ", "mean": "cơ thể"},
    {"hanzi": "生病", "pinyin": "shēngbìng", "mean": "bị bệnh"},
    {"hanzi": "生日", "pinyin": "shēngrì", "mean": "sinh nhật"},
    {"hanzi": "时间", "pinyin": "shíjiān", "mean": "thời gian"},
    {"hanzi": "事情", "pinyin": "shìqíng", "mean": "việc"},
    {"hanzi": "手表", "pinyin": "shǒubiǎo", "mean": "đồng hồ"},
    {"hanzi": "手机", "pinyin": "shǒujī", "mean": "điện thoại di động"},
    {"hanzi": "送", "pinyin": "sòng", "mean": "tặng"},
    {"hanzi": "所以", "pinyin": "suǒyǐ", "mean": "vì vậy"},
    {"hanzi": "它", "pinyin": "tā", "mean": "nó (cho vật, động vật)"},
    {"hanzi": "踢足球", "pinyin": "tī zúqiú", "mean": "đá bóng"},
    {"hanzi": "题", "pinyin": "tí", "mean": "câu hỏi, đề bài"},
    {"hanzi": "跳舞", "pinyin": "tiàowǔ", "mean": "nhảy múa"},
    {"hanzi": "外", "pinyin": "wài", "mean": "ngoài"},
    {"hanzi": "玩", "pinyin": "wán", "mean": "chơi"},
    {"hanzi": "完", "pinyin": "wán", "mean": "xong, hoàn thành"},
    {"hanzi": "晚上", "pinyin": "wǎnshàng", "mean": "buổi tối"},
    {"hanzi": "为什么", "pinyin": "wèishénme", "mean": "tại sao"},
    {"hanzi": "问", "pinyin": "wèn", "mean": "hỏi"},
    {"hanzi": "问题", "pinyin": "wèntí", "mean": "vấn đề"},
    {"hanzi": "西瓜", "pinyin": "xīguā", "mean": "dưa hấu"},
    {"hanzi": "希望", "pinyin": "xīwàng", "mean": "hy vọng"},
    {"hanzi": "洗", "pinyin": "xǐ", "mean": "rửa"},
    {"hanzi": "向", "pinyin": "xiàng", "mean": "hướng về, đối với"},
    {"hanzi": "小时", "pinyin": "xiǎoshí", "mean": "tiếng đồng hồ"},
    {"hanzi": "笑", "pinyin": "xiào", "mean": "cười"},
    {"hanzi": "新", "pinyin": "xīn", "mean": "mới"},
    {"hanzi": "姓", "pinyin": "xìng", "mean": "họ"},
    {"hanzi": "休息", "pinyin": "xiūxi", "mean": "nghỉ ngơi"},
    {"hanzi": "雪", "pinyin": "xuě", "mean": "tuyết"},
    {"hanzi": "颜色", "pinyin": "yánsè", "mean": "màu sắc"},
    {"hanzi": "眼睛", "pinyin": "yǎnjing", "mean": "mắt"},
    {"hanzi": "羊肉", "pinyin": "yángròu", "mean": "thịt cừu"},
    {"hanzi": "要", "pinyin": "yào", "mean": "muốn, cần"},
    {"hanzi": "药", "pinyin": "yào", "mean": "thuốc"},
    {"hanzi": "也", "pinyin": "yě", "mean": "cũng"},
    {"hanzi": "已经", "pinyin": "yǐjīng", "mean": "đã"},
    {"hanzi": "一起", "pinyin": "yìqǐ", "mean": "cùng nhau"},
    {"hanzi": "意思", "pinyin": "yìsi", "mean": "ý nghĩa"},
    {"hanzi": "阴", "pinyin": "yīn", "mean": "âm u, trời nhiều mây"},
    {"hanzi": "因为", "pinyin": "yīnwèi", "mean": "vì"},
    {"hanzi": "游泳", "pinyin": "yóuyǒng", "mean": "bơi"},
    {"hanzi": "右边", "pinyin": "yòubiān", "mean": "bên phải"},
    {"hanzi": "鱼", "pinyin": "yú", "mean": "cá"},
    {"hanzi": "元", "pinyin": "yuán", "mean": "Đồng (đơn vị tiền tệ)"},
    {"hanzi": "远", "pinyin": "yuǎn", "mean": "xa"},
    {"hanzi": "运动", "pinyin": "yùndòng", "mean": "vận"},
    {"hanzi": "再", "pinyin": "zài", "mean": "lại"},
    {"hanzi": "早上", "pinyin": "zǎoshàng", "mean": "buổi sáng"},
    {"hanzi": "张", "pinyin": "zhāng", "mean": "tờ, bức (dùng cho vật phẳng, giấy, tranh, bàn)"},
    {"hanzi": "丈夫", "pinyin": "zhàngfu", "mean": "chồng"},
    {"hanzi": "找", "pinyin": "zhǎo", "mean": "tìm"},
    {"hanzi": "着", "pinyin": "zhe", "mean": "đang (dùng để chỉ trạng thái hiện tại)"},
    {"hanzi": "真", "pinyin": "zhēn", "mean": "thật"},
    {"hanzi": "正在", "pinyin": "zhèngzài", "mean": "đang"},
    {"hanzi": "知道", "pinyin": "zhīdào", "mean": "biết"},
    {"hanzi": "准备", "pinyin": "zhǔnbèi", "mean": "chuẩn bị"},
    {"hanzi": "自行车", "pinyin": "zìxíngchē", "mean": "xe đạp"},
    {"hanzi": "走", "pinyin": "zǒu", "mean": "đi"},
    {"hanzi": "最", "pinyin": "zuì", "mean": "nhất (so sánh nhất)"},
    {"hanzi": "左边", "pinyin": "zuǒbiān", "mean": "bên trái"},
  ];

  const hsk3Deck = [
    {"hanzi": "阿姨", "pinyin": "āyí", "mean": "dì, cô"},
    {"hanzi": "啊", "pinyin": "a", "mean": "a, à, ơ (trợ từ ngữ khí)"},
    {"hanzi": "矮", "pinyin": "ǎi", "mean": "thấp, lùn"},
    {"hanzi": "爱好", "pinyin": "àihào", "mean": "sở thích"},
    {"hanzi": "安静", "pinyin": "ānjìng", "mean": "yên tĩnh"},
    {"hanzi": "把", "pinyin": "bǎ", "mean": "đem, lấy (giới từ)"},
    {"hanzi": "班", "pinyin": "bān", "mean": "lớp, ca (làm việc)"},
    {"hanzi": "搬", "pinyin": "bān", "mean": "chuyển, dời"},
    {"hanzi": "半", "pinyin": "bàn", "mean": "một nửa"},
    {"hanzi": "办法", "pinyin": "bànfǎ", "mean": "biện pháp"},
    {"hanzi": "办公室", "pinyin": "bàngōngshì", "mean": "văn phòng"},
    {"hanzi": "帮忙", "pinyin": "bāngmáng", "mean": "giúp đỡ (động từ li hợp)"},
    {"hanzi": "包", "pinyin": "bāo", "mean": "túi, bao"},
    {"hanzi": "饱", "pinyin": "bǎo", "mean": "no"},
    {"hanzi": "北方", "pinyin": "běifāng", "mean": "miền Bắc"},
    {"hanzi": "被", "pinyin": "bèi", "mean": "bị, được (giới từ bị động)"},
    {"hanzi": "比较", "pinyin": "bǐjiào", "mean": "khá, tương đối"},
    {"hanzi": "比赛", "pinyin": "bǐsài", "mean": "cuộc thi, thi đấu"},
    {"hanzi": "必须", "pinyin": "bìxū", "mean": "phải, cần phải"},
    {"hanzi": "变化", "pinyin": "biànhuà", "mean": "thay đổi"},
    {"hanzi": "表示", "pinyin": "biǎoshì", "mean": "biểu thị, thể hiện"},
    {"hanzi": "表演", "pinyin": "biǎoyǎn", "mean": "biểu diễn"},
    {"hanzi": "别人", "pinyin": "biérén", "mean": "người khác"},
    {"hanzi": "宾馆", "pinyin": "bīnguǎn", "mean": "khách sạn"},
    {"hanzi": "冰箱", "pinyin": "bīngxiāng", "mean": "tủ lạnh"},
    {"hanzi": "才", "pinyin": "cái", "mean": "mới (nhấn mạnh thời gian muộn, trễ)"},
    {"hanzi": "菜单", "pinyin": "càidān", "mean": "thực đơn"},
    {"hanzi": "参加", "pinyin": "cānjiā", "mean": "tham gia"},
    {"hanzi": "草", "pinyin": "cǎo", "mean": "cỏ"},
    {"hanzi": "层", "pinyin": "céng", "mean": "tầng"},
    {"hanzi": "差", "pinyin": "chà", "mean": "kém, thiếu, tệ"},
    {"hanzi": "超市", "pinyin": "chāoshì", "mean": "siêu thị"},
    {"hanzi": "衬衫", "pinyin": "chènshān", "mean": "áo sơ mi"},
    {"hanzi": "成绩", "pinyin": "chéngjì", "mean": "thành tích"},
    {"hanzi": "城市", "pinyin": "chéngshì", "mean": "thành phố"},
    {"hanzi": "迟到", "pinyin": "chídào", "mean": "đến trễ"},
    {"hanzi": "出现", "pinyin": "chūxiàn", "mean": "xuất hiện"},
    {"hanzi": "厨房", "pinyin": "chúfáng", "mean": "nhà bếp"},
    {"hanzi": "除了", "pinyin": "chúle", "mean": "ngoài ra, trừ ra"},
    {"hanzi": "春", "pinyin": "chūn", "mean": "mùa xuân"},
    {"hanzi": "词语", "pinyin": "cíyǔ", "mean": "từ ngữ"},
    {"hanzi": "聪明", "pinyin": "cōngmíng", "mean": "thông minh"},
    {"hanzi": "打扫", "pinyin": "dǎsǎo", "mean": "quét dọn"},
    {"hanzi": "打算", "pinyin": "dǎsuàn", "mean": "dự định"},
    {"hanzi": "带", "pinyin": "dài", "mean": "mang theo, dẫn theo"},
    {"hanzi": "担心", "pinyin": "dānxīn", "mean": "lo lắng"},
    {"hanzi": "蛋糕", "pinyin": "dàngāo", "mean": "bánh ngọt"},
    {"hanzi": "当然", "pinyin": "dāngrán", "mean": "đương nhiên"},
    {"hanzi": "地", "pinyin": "de", "mean": "trợ từ của động từ"},
    {"hanzi": "灯", "pinyin": "dēng", "mean": "đèn"},
    {"hanzi": "低", "pinyin": "dī", "mean": "thấp"},
    {"hanzi": "地方", "pinyin": "dìfāng", "mean": "nơi, chỗ"},
    {"hanzi": "地铁", "pinyin": "dìtiě", "mean": "tàu điện ngầm"},
    {"hanzi": "地图", "pinyin": "dìtú", "mean": "bản đồ"},
    {"hanzi": "电梯", "pinyin": "diàntī", "mean": "thang máy"},
    {"hanzi": "电子邮箱", "pinyin": "diànzǐ yóuxiāng", "mean": "hộp thư điện tử (email)"},
    {"hanzi": "东", "pinyin": "dōng", "mean": "đông (hướng đông)"},
    {"hanzi": "冬", "pinyin": "dōng", "mean": "mùa đông"},
    {"hanzi": "动物", "pinyin": "dòngwù", "mean": "động vật"},
    {"hanzi": "短", "pinyin": "duǎn", "mean": "ngắn"},
    {"hanzi": "段", "pinyin": "duàn", "mean": "đoạn, quãng"},
    {"hanzi": "锻炼", "pinyin": "duànliàn", "mean": "luyện tập, rèn luyện"},
    {"hanzi": "多么", "pinyin": "duōme", "mean": "bao nhiêu, biết bao"},
    {"hanzi": "饿", "pinyin": "è", "mean": "đói"},
    {"hanzi": "而且", "pinyin": "érqiě", "mean": "mà còn, hơn nữa"},
    {"hanzi": "耳朵", "pinyin": "ěrduo", "mean": "tai"},
    {"hanzi": "发烧", "pinyin": "fāshāo", "mean": "sốt"},
    {"hanzi": "发现", "pinyin": "fāxiàn", "mean": "phát hiện"},
    {"hanzi": "方便", "pinyin": "fāngbiàn", "mean": "thuận tiện"},
    {"hanzi": "放", "pinyin": "fàng", "mean": "đặt, để"},
    {"hanzi": "放心", "pinyin": "fàngxīn", "mean": "yên tâm"},
    {"hanzi": "分", "pinyin": "fēn", "mean": "phút, phân"},
    {"hanzi": "附近", "pinyin": "fùjìn", "mean": "gần đây, vùng lân cận"},
    {"hanzi": "复习", "pinyin": "fùxí", "mean": "ôn tập"},
    {"hanzi": "干净", "pinyin": "gānjìng", "mean": "sạch sẽ"},
    {"hanzi": "敢", "pinyin": "gǎn", "mean": "dám"},
    {"hanzi": "感冒", "pinyin": "gǎnmào", "mean": "cảm mạo, cảm lạnh"},
    {"hanzi": "刚才", "pinyin": "gāngcái", "mean": "vừa mới"},
    {"hanzi": "跟", "pinyin": "gēn", "mean": "cùng với"},
    {"hanzi": "根据", "pinyin": "gēnjù", "mean": "căn cứ vào"},
    {"hanzi": "更", "pinyin": "gèng", "mean": "hơn, càng"},
    {"hanzi": "公园", "pinyin": "gōngyuán", "mean": "công viên"},
    {"hanzi": "故事", "pinyin": "gùshì", "mean": "câu chuyện"},
    {"hanzi": "刮风", "pinyin": "guā fēng", "mean": "gió thổi"},
    {"hanzi": "关", "pinyin": "guān", "mean": "đóng, tắt"},
    {"hanzi": "关系", "pinyin": "guānxì", "mean": "quan hệ"},
    {"hanzi": "关心", "pinyin": "guānxīn", "mean": "quan tâm"},
    {"hanzi": "关于", "pinyin": "guānyú", "mean": "về (liên quan đến)"},
    {"hanzi": "国家", "pinyin": "guójiā", "mean": "quốc gia"},
    {"hanzi": "果汁", "pinyin": "guǒzhī", "mean": "nước ép trái cây"},
    {"hanzi": "过去", "pinyin": "guòqù", "mean": "quá khứ"},
    {"hanzi": "还是", "pinyin": "háishì", "mean": "vẫn còn, hay là"},
    {"hanzi": "害怕", "pinyin": "hàipà", "mean": "sợ"},
    {"hanzi": "河", "pinyin": "hé", "mean": "sông"},
    {"hanzi": "黑板", "pinyin": "hēibǎn", "mean": "bảng"},
    {"hanzi": "护照", "pinyin": "hùzhào", "mean": "hộ chiếu"},
    {"hanzi": "花", "pinyin": "huā", "mean": "hoa, tiêu (tiền, thời gian)"},
    {"hanzi": "花园", "pinyin": "huāyuán", "mean": "vườn hoa"},
    {"hanzi": "画", "pinyin": "huà", "mean": "vẽ, tranh"},
    {"hanzi": "坏", "pinyin": "huài", "mean": "hỏng, xấu"},
    {"hanzi": "还", "pinyin": "huán", "mean": "trả lại, hoàn"},
    {"hanzi": "环境", "pinyin": "huánjìng", "mean": "môi trường"},
    {"hanzi": "换", "pinyin": "huàn", "mean": "đổi"},
    {"hanzi": "黄", "pinyin": "huáng", "mean": "màu vàng"},
    {"hanzi": "会议", "pinyin": "huìyì", "mean": "hội nghị, cuộc họp"},
    {"hanzi": "或者", "pinyin": "huòzhě", "mean": "hoặc là"},
    {"hanzi": "机会", "pinyin": "jīhuì", "mean": "cơ hội"},
    {"hanzi": "几乎", "pinyin": "jīhū", "mean": "hầu như, gần như"},
    {"hanzi": "极", "pinyin": "jí", "mean": "cực kỳ"},
    {"hanzi": "记得", "pinyin": "jìdé", "mean": "nhớ, nhớ đến"},
    {"hanzi": "季节", "pinyin": "jìjié", "mean": "mùa"},
    {"hanzi": "检查", "pinyin": "jiǎnchá", "mean": "kiểm tra"},
    {"hanzi": "简单", "pinyin": "jiǎndān", "mean": "đơn giản"},
    {"hanzi": "健康", "pinyin": "jiànkāng", "mean": "khỏe mạnh"},
    {"hanzi": "见面", "pinyin": "jiànmiàn", "mean": "gặp mặt"},
    {"hanzi": "讲", "pinyin": "jiǎng", "mean": "nói, giảng"},
    {"hanzi": "教", "pinyin": "jiāo", "mean": "dạy"},
    {"hanzi": "角", "pinyin": "jiǎo", "mean": "góc"},
    {"hanzi": "脚", "pinyin": "jiǎo", "mean": "chân"},
    {"hanzi": "接", "pinyin": "jiē", "mean": "nhận, tiếp"},
    {"hanzi": "街道", "pinyin": "jiēdào", "mean": "đường phố"},
    {"hanzi": "结婚", "pinyin": "jiéhūn", "mean": "kết hôn"},
    {"hanzi": "结束", "pinyin": "jiéshù", "mean": "kết thúc"},
    {"hanzi": "节目", "pinyin": "jiémù", "mean": "chương trình"},
    {"hanzi": "节日", "pinyin": "jiérì", "mean": "ngày lễ"},
    {"hanzi": "解决", "pinyin": "jiějué", "mean": "giải quyết"},
    {"hanzi": "借", "pinyin": "jiè", "mean": "mượn"},
    {"hanzi": "经常", "pinyin": "jīngcháng", "mean": "thường xuyên"},
    {"hanzi": "经过", "pinyin": "jīngguò", "mean": "trải qua"},
    {"hanzi": "经历", "pinyin": "jīnglì", "mean": "kinh nghiệm"},
    {"hanzi": "久", "pinyin": "jiǔ", "mean": "lâu"},
    {"hanzi": "旧", "pinyin": "jiù", "mean": "cũ"},
    {"hanzi": "举行", "pinyin": "jǔxíng", "mean": "tổ chức"},
    {"hanzi": "句子", "pinyin": "jùzi", "mean": "câu"},
    {"hanzi": "决定", "pinyin": "juédìng", "mean": "quyết định"},
    {"hanzi": "可爱", "pinyin": "kě'ài", "mean": "đáng yêu"},
    {"hanzi": "刻", "pinyin": "kè", "mean": "khắc (15 phút)"},
    {"hanzi": "客人", "pinyin": "kèrén", "mean": "khách"},
    {"hanzi": "空调", "pinyin": "kòngtiáo", "mean": "máy điều hòa"},
    {"hanzi": "口", "pinyin": "kǒu", "mean": "miệng, khẩu"},
    {"hanzi": "哭", "pinyin": "kū", "mean": "khóc"},
    {"hanzi": "裤子", "pinyin": "kùzi", "mean": "quần"},
    {"hanzi": "筷子", "pinyin": "kuàizi", "mean": "đũa"},
    {"hanzi": "蓝", "pinyin": "lán", "mean": "màu xanh"},
    {"hanzi": "老", "pinyin": "lǎo", "mean": "già, cũ"},
    {"hanzi": "离开", "pinyin": "líkāi", "mean": "rời khỏi"},
    {"hanzi": "礼物", "pinyin": "lǐwù", "mean": "quà"},
    {"hanzi": "历史", "pinyin": "lìshǐ", "mean": "lịch sử"},
    {"hanzi": "脸", "pinyin": "liǎn", "mean": "mặt"},
    {"hanzi": "练习", "pinyin": "liànxí", "mean": "luyện tập"},
    {"hanzi": "辆", "pinyin": "liàng", "mean": "chiếc (xe)"},
    {"hanzi": "了解", "pinyin": "liǎojiě", "mean": "hiểu rõ"},
    {"hanzi": "邻居", "pinyin": "línjū", "mean": "hàng xóm"},
    {"hanzi": "楼", "pinyin": "lóu", "mean": "tòa nhà"},
    {"hanzi": "马", "pinyin": "mǎ", "mean": "con ngựa"},
    {"hanzi": "马上", "pinyin": "mǎshàng", "mean": "ngay lập tức"},
    {"hanzi": "满意", "pinyin": "mǎnyì", "mean": "hài lòng"},
    {"hanzi": "帽子", "pinyin": "màozi", "mean": "mũ"},
    {"hanzi": "米", "pinyin": "mǐ", "mean": "gạo, mét"},
    {"hanzi": "面包", "pinyin": "miànbāo", "mean": "bánh mì"},
    {"hanzi": "面条", "pinyin": "miàntiáo", "mean": "mì sợi"},
    {"hanzi": "明白", "pinyin": "míngbái", "mean": "hiểu rõ"},
    {"hanzi": "拿", "pinyin": "ná", "mean": "cầm, lấy"},
    {"hanzi": "奶奶", "pinyin": "nǎinai", "mean": "bà nội"},
    {"hanzi": "南", "pinyin": "nán", "mean": "phía nam"},
    {"hanzi": "难", "pinyin": "nán", "mean": "khó"},
    {"hanzi": "难过", "pinyin": "nánguò", "mean": "buồn"},
    {"hanzi": "年级", "pinyin": "niánjí", "mean": "lớp, năm học"},
    {"hanzi": "年轻", "pinyin": "niánqīng", "mean": "trẻ"},
    {"hanzi": "鸟", "pinyin": "niǎo", "mean": "chim"},
    {"hanzi": "努力", "pinyin": "nǔlì", "mean": "nỗ lực, chăm chỉ"},
    {"hanzi": "爬山", "pinyin": "páshān", "mean": "leo núi"},
    {"hanzi": "盘子", "pinyin": "pánzi", "mean": "đĩa"},
    {"hanzi": "胖", "pinyin": "pàng", "mean": "béo"},
    {"hanzi": "啤酒", "pinyin": "píjiǔ", "mean": "bia"},
    {"hanzi": "葡萄", "pinyin": "pútao", "mean": "nho"},
    {"hanzi": "普通话", "pinyin": "pǔtōnghuà", "mean": "tiếng Phổ thông (tiếng Trung chuẩn)"},
    {"hanzi": "骑", "pinyin": "qí", "mean": "cưỡi, đi (xe đạp, xe máy)"},
    {"hanzi": "其实", "pinyin": "qíshí", "mean": "thực ra"},
    {"hanzi": "其他", "pinyin": "qítā", "mean": "khác"},
    {"hanzi": "奇怪", "pinyin": "qíguài", "mean": "kỳ lạ"},
    {"hanzi": "铅笔", "pinyin": "qiānbǐ", "mean": "bút chì"},
    {"hanzi": "清楚", "pinyin": "qīngchǔ", "mean": "rõ ràng"},
    {"hanzi": "秋", "pinyin": "qiū", "mean": "mùa thu"},
    {"hanzi": "裙子", "pinyin": "qúnzi", "mean": "váy"},
    {"hanzi": "然后", "pinyin": "ránhòu", "mean": "sau đó"},
    {"hanzi": "热情", "pinyin": "rèqíng", "mean": "nhiệt tình"},
    {"hanzi": "认为", "pinyin": "rènwéi", "mean": "cho rằng"},
    {"hanzi": "认真", "pinyin": "rènzhēn", "mean": "nghiêm túc"},
    {"hanzi": "容易", "pinyin": "róngyì", "mean": "dễ dàng"},
    {"hanzi": "如果", "pinyin": "rúguǒ", "mean": "nếu như"},
    {"hanzi": "伞", "pinyin": "sǎn", "mean": "ô, dù"},
    {"hanzi": "上网", "pinyin": "shàngwǎng", "mean": "lên mạng"},
    {"hanzi": "生气", "pinyin": "shēngqì", "mean": "giận dữ"},
    {"hanzi": "声音", "pinyin": "shēngyīn", "mean": "âm thanh"},
    {"hanzi": "使", "pinyin": "shǐ", "mean": "khiến, làm cho"},
    {"hanzi": "世界", "pinyin": "shìjiè", "mean": "thế giới"},
    {"hanzi": "瘦", "pinyin": "shòu", "mean": "gầy"},
    {"hanzi": "舒服", "pinyin": "shūfu", "mean": "thoải mái"},
    {"hanzi": "叔叔", "pinyin": "shūshu", "mean": "chú"},
    {"hanzi": "树", "pinyin": "shù", "mean": "cây"},
    {"hanzi": "数学", "pinyin": "shùxué", "mean": "toán học"},
    {"hanzi": "刷牙", "pinyin": "shuāyá", "mean": "đánh răng"},
    {"hanzi": "双", "pinyin": "shuāng", "mean": "đôi"},
    {"hanzi": "水平", "pinyin": "shuǐpíng", "mean": "trình độ"},
    {"hanzi": "司机", "pinyin": "sījī", "mean": "lái xe, tài xế"},
    {"hanzi": "虽然", "pinyin": "suīrán", "mean": "tuy rằng"},
    {"hanzi": "太阳", "pinyin": "tàiyáng", "mean": "mặt trời"},
    {"hanzi": "糖", "pinyin": "táng", "mean": "kẹo, đường"},
    {"hanzi": "特别", "pinyin": "tèbié", "mean": "đặc biệt"},
    {"hanzi": "疼", "pinyin": "téng", "mean": "đau"},
    {"hanzi": "提高", "pinyin": "tígāo", "mean": "nâng cao"},
    {"hanzi": "体育", "pinyin": "tǐyù", "mean": "thể dục, thể thao"},
    {"hanzi": "甜", "pinyin": "tián", "mean": "ngọt"},
    {"hanzi": "条", "pinyin": "tiáo", "mean": "sợi, cái"},
    {"hanzi": "同事", "pinyin": "tóngshì", "mean": "đồng nghiệp"},
    {"hanzi": "同意", "pinyin": "tóngyì", "mean": "đồng ý"},
    {"hanzi": "头发", "pinyin": "tóufa", "mean": "tóc"},
    {"hanzi": "突然", "pinyin": "tūrán", "mean": "đột nhiên"},
    {"hanzi": "图书馆", "pinyin": "túshūguǎn", "mean": "thư viện"},
    {"hanzi": "腿", "pinyin": "tuǐ", "mean": "chân"},
    {"hanzi": "完成", "pinyin": "wánchéng", "mean": "hoàn thành"},
    {"hanzi": "碗", "pinyin": "wǎn", "mean": "bát"},
    {"hanzi": "万", "pinyin": "wàn", "mean": "vạn, mười nghìn"},
    {"hanzi": "忘记", "pinyin": "wàngjì", "mean": "quên"},
    {"hanzi": "位", "pinyin": "wèi", "mean": "vị, ngài"},
    {"hanzi": "为", "pinyin": "wèi", "mean": "vì"},
    {"hanzi": "为了", "pinyin": "wèile", "mean": "để, vì"},
    {"hanzi": "文化", "pinyin": "wénhuà", "mean": "văn hóa"},
    {"hanzi": "西", "pinyin": "xī", "mean": "phía tây"},
    {"hanzi": "习惯", "pinyin": "xíguàn", "mean": "thói quen"},
    {"hanzi": "洗手间", "pinyin": "xǐshǒujiān", "mean": "nhà vệ sinh"},
    {"hanzi": "洗澡", "pinyin": "xǐzǎo", "mean": "tắm"},
    {"hanzi": "喜欢", "pinyin": "xǐhuān", "mean": "thích"},
    {"hanzi": "现在", "pinyin": "xiànzài", "mean": "hiện"},
    {"hanzi": "香蕉", "pinyin": "xiāngjiāo", "mean": "chuối"},
    {"hanzi": "相同", "pinyin": "xiāngtóng", "mean": "giống nhau"},
    {"hanzi": "相信", "pinyin": "xiāngxìn", "mean": "tin tưởng"},
    {"hanzi": "像", "pinyin": "xiàng", "mean": "giống"},
    {"hanzi": "小心", "pinyin": "xiǎoxīn", "mean": "cẩn thận"},
    {"hanzi": "校长", "pinyin": "xiàozhǎng", "mean": "hiệu trưởng"},
    {"hanzi": "鞋", "pinyin": "xié", "mean": "giày"},
    {"hanzi": "新闻", "pinyin": "xīnwén", "mean": "tin tức"},
    {"hanzi": "新鲜", "pinyin": "xīnxiān", "mean": "tươi mới"},
    {"hanzi": "信", "pinyin": "xìn", "mean": "thư, tin tưởng"},
    {"hanzi": "行李箱", "pinyin": "xínglǐxiāng", "mean": "vali"},
    {"hanzi": "兴趣", "pinyin": "xìngqù", "mean": "hứng thú"},
    {"hanzi": "熊猫", "pinyin": "xióngmāo", "mean": "gấu trúc"},
    {"hanzi": "需要", "pinyin": "xūyào", "mean": "cần"},
    {"hanzi": "选择", "pinyin": "xuǎnzé", "mean": "lựa chọn"},
    {"hanzi": "眼镜", "pinyin": "yǎnjìng", "mean": "kính"},
    {"hanzi": "要求", "pinyin": "yāoqiú", "mean": "yêu cầu"},
    {"hanzi": "爷爷", "pinyin": "yéye", "mean": "ông nội"},
    {"hanzi": "一定", "pinyin": "yīdìng", "mean": "nhất định"},
    {"hanzi": "一共", "pinyin": "yīgòng", "mean": "tổng cộng"},
    {"hanzi": "一会儿", "pinyin": "yīhuìr", "mean": "một lát"},
    {"hanzi": "一样", "pinyin": "yīyàng", "mean": "giống nhau"},
    {"hanzi": "以后", "pinyin": "yǐhòu", "mean": "sau này"},
    {"hanzi": "以前", "pinyin": "yǐqián", "mean": "trước đây"},
    {"hanzi": "以为", "pinyin": "yǐwéi", "mean": "cho rằng"},
    {"hanzi": "一般", "pinyin": "yībān", "mean": "thông thường"},
    {"hanzi": "一边", "pinyin": "yībiān", "mean": "vừa ... vừa ..."},
    {"hanzi": "一直", "pinyin": "yīzhí", "mean": "luôn luôn"},
    {"hanzi": "音乐", "pinyin": "yīnyuè", "mean": "âm nhạc"},
    {"hanzi": "银行", "pinyin": "yínháng", "mean": "ngân hàng"},
    {"hanzi": "应该", "pinyin": "yīnggāi", "mean": "nên"},
    {"hanzi": "影响", "pinyin": "yǐngxiǎng", "mean": "ảnh hưởng"},
    {"hanzi": "用", "pinyin": "yòng", "mean": "dùng"},
    {"hanzi": "游戏", "pinyin": "yóuxì", "mean": "trò chơi"},
    {"hanzi": "又", "pinyin": "yòu", "mean": "lại, vừa"},
    {"hanzi": "有名", "pinyin": "yǒumíng", "mean": "nổi tiếng"},
    {"hanzi": "遇到", "pinyin": "yùdào", "mean": "gặp phải"},
    {"hanzi": "月亮", "pinyin": "yuèliàng", "mean": "mặt trăng"},
    {"hanzi": "云", "pinyin": "yún", "mean": "mây"},
    {"hanzi": "站", "pinyin": "zhàn", "mean": "đứng, trạm"},
    {"hanzi": "长", "pinyin": "zhǎng", "mean": "dài"},
    {"hanzi": "着急", "pinyin": "zhāojí", "mean": "lo lắng"},
    {"hanzi": "照顾", "pinyin": "zhàogu", "mean": "chăm sóc"},
    {"hanzi": "照片", "pinyin": "zhàopiàn", "mean": "bức ảnh"},
    {"hanzi": "照相机", "pinyin": "zhàoxiàngjī", "mean": "máy ảnh"},
    {"hanzi": "只", "pinyin": "zhǐ", "mean": "chỉ"},
    {"hanzi": "中间", "pinyin": "zhōngjiān", "mean": "ở giữa"},
    {"hanzi": "终于", "pinyin": "zhōngyú", "mean": "cuối cùng"},
    {"hanzi": "种", "pinyin": "zhǒng", "mean": "loại, hạt giống"},
    {"hanzi": "重要", "pinyin": "zhòngyào", "mean": "quan trọng"},
    {"hanzi": "主要", "pinyin": "zhǔyào", "mean": "chủ yếu"},
    {"hanzi": "周末", "pinyin": "zhōumò", "mean": "cuối tuần"},
    {"hanzi": "祝", "pinyin": "zhù", "mean": "chúc"},
    {"hanzi": "注意", "pinyin": "zhùyì", "mean": "chú ý"},
    {"hanzi": "字典", "pinyin": "zìdiǎn", "mean": "từ điển"},
    {"hanzi": "自己", "pinyin": "zìjǐ", "mean": "bản thân"},
    {"hanzi": "总是", "pinyin": "zǒngshì", "mean": "luôn luôn"},
    {"hanzi": "最近", "pinyin": "zuìjìn", "mean": "gần đây"},
    {"hanzi": "作业", "pinyin": "zuòyè", "mean": "bài tập về nhà"},
    {"hanzi": "作用", "pinyin": "zuòyòng", "mean": "tác dụng"},
  ];

  const hsk4Deck = [
    {"hanzi": "爱情", "pinyin": "ài qíng [ái tình]", "mean": "tình yêu"},
    {"hanzi": "安排", "pinyin": "ān pái [an bài]", "mean": "sắp xếp"},
    {"hanzi": "安全", "pinyin": "ān quán [an toàn]", "mean": "an toàn"},
    {"hanzi": "按时", "pinyin": "àn shí", "mean": "đúng hạn"},
    {"hanzi": "按照", "pinyin": "àn zhào", "mean": "dựa vào, theo"},
    {"hanzi": "百分之", "pinyin": "bǎi fēn zhī", "mean": "%"},
    {"hanzi": "棒", "pinyin": "bàng", "mean": "cây gậy/ giỏi, tốt"},
    {"hanzi": "包子", "pinyin": "bāo zi", "mean": "bánh bao"},
    {"hanzi": "保护", "pinyin": "bǎo hù", "mean": "che chở, bảo vệ"},
    {"hanzi": "保证", "pinyin": "bǎo zhèng", "mean": "đảm bảo, cam đoan"},
    {"hanzi": "报名", "pinyin": "bào míng", "mean": "đăng kí"},
    {"hanzi": "抱", "pinyin": "bào", "mean": "ôm"},
    {"hanzi": "抱歉", "pinyin": "bào qiàn", "mean": "xin lỗi"},
    {"hanzi": "倍", "pinyin": "bèi", "mean": "lần"},
    {"hanzi": "本来", "pinyin": "běn lái", "mean": "vốn có"},
    {"hanzi": "笨", "pinyin": "bèn", "mean": "ngốc nghếch"},
    {"hanzi": "比如", "pinyin": "bǐ rú", "mean": "ví dụ như"},
    {"hanzi": "毕业", "pinyin": "bì yè", "mean": "tốt nghiệp"},
    {"hanzi": "遍", "pinyin": "biàn", "mean": "lần, lượt"},
    {"hanzi": "标准", "pinyin": "biāo zhǔn", "mean": "tiêu chuẩn"},
    {"hanzi": "表格", "pinyin": "biǎo gé", "mean": "bảng biểu"},
    {"hanzi": "表示", "pinyin": "biǎo shì", "mean": "biểu thị, cho thấy"},
    {"hanzi": "表演", "pinyin": "biǎo yǎn", "mean": "biểu diễn"},
    {"hanzi": "表扬", "pinyin": "biǎo yáng", "mean": "tuyên dương"},
    {"hanzi": "饼干", "pinyin": "bǐng gān", "mean": "bánh"},
    {"hanzi": "并且", "pinyin": "bìng qiě", "mean": "đồng thời"},
    {"hanzi": "博士", "pinyin": "bó shì", "mean": "tiến sĩ"},
    {"hanzi": "不得不", "pinyin": "bù dé bù", "mean": "đành"},
    {"hanzi": "不管", "pinyin": "bù guǎn", "mean": "bất kể"},
    {"hanzi": "不过", "pinyin": "bù guò", "mean": "nhưng, có điều"},
    {"hanzi": "不仅", "pinyin": "bù jǐn", "mean": "không những"},
    {"hanzi": "部分", "pinyin": "bù fèn", "mean": "bộ phận, phần"},
    {"hanzi": "擦", "pinyin": "cā", "mean": "lau"},
    {"hanzi": "猜", "pinyin": "cāi", "mean": "đoán"},
    {"hanzi": "材料", "pinyin": "cái liào", "mean": "tài liệu"},
    {"hanzi": "参观", "pinyin": "cān guān", "mean": "tham quan"},
    {"hanzi": "餐厅", "pinyin": "cān tīng", "mean": "căng tin, nhà ăn"},
    {"hanzi": "厕所", "pinyin": "cè suǒ", "mean": "phòng vệ sinh"},
    {"hanzi": "差不多", "pinyin": "chà bù duō", "mean": "gần như"},
    {"hanzi": "长城", "pinyin": "cháng chéng", "mean": "Trường Thành"},
    {"hanzi": "长江", "pinyin": "cháng jiāng", "mean": "Trường Giang"},
    {"hanzi": "尝", "pinyin": "cháng", "mean": "nếm thử"},
    {"hanzi": "场", "pinyin": "chǎng", "mean": "trận, suất"},
    {"hanzi": "超过", "pinyin": "chāo guò", "mean": "vượt trên"},
    {"hanzi": "成功", "pinyin": "chéng gōng", "mean": "thành công"},
    {"hanzi": "成为", "pinyin": "chéng wéi", "mean": "trở thành"},
    {"hanzi": "诚实", "pinyin": "chéng shí", "mean": "trung thực"},
    {"hanzi": "乘坐", "pinyin": "chéng zuò", "mean": "ngồi xe"},
    {"hanzi": "吃惊", "pinyin": "chī jīng", "mean": "ngạc nhiên"},
    {"hanzi": "重新", "pinyin": "chóng xīn", "mean": "làm lại"},
    {"hanzi": "抽烟", "pinyin": "chōu yān", "mean": "hút thuốc"},
    {"hanzi": "出差", "pinyin": "chū chāi", "mean": "đi công tác"},
    {"hanzi": "出发", "pinyin": "chū fā", "mean": "xuất phát"},
    {"hanzi": "出生", "pinyin": "chū shēng", "mean": "ra đời"},
    {"hanzi": "出现", "pinyin": "chū xiàn", "mean": "xuất hiện"},
    {"hanzi": "厨房", "pinyin": "chú fáng", "mean": "phòng bếp"},
    {"hanzi": "传真", "pinyin": "chuán zhēn", "mean": "fax, bản fax"},
    {"hanzi": "窗户", "pinyin": "chuāng hù", "mean": "cửa sổ"},
    {"hanzi": "词语", "pinyin": "cí yǔ", "mean": "từ ngữ"},
    {"hanzi": "从来", "pinyin": "cóng lái", "mean": "từ trước đến nay"},
    {"hanzi": "粗心", "pinyin": "cū xīn", "mean": "thô lỗ, cẩu thả"},
    {"hanzi": "存", "pinyin": "cún", "mean": "giữ, tiết kiệm, tồn"},
    {"hanzi": "错误", "pinyin": "cuò wù", "mean": "sai lầm"},
    {"hanzi": "答案", "pinyin": "dá àn", "mean": "đáp án"},
    {"hanzi": "打扮", "pinyin": "dǎ bàn", "mean": "trau chuốt, trang điểm"},
    {"hanzi": "打扰", "pinyin": "dǎ rǎo", "mean": "làm phiền"},
    {"hanzi": "打印", "pinyin": "dǎ yìn", "mean": "in ấn"},
    {"hanzi": "打招呼", "pinyin": "dǎ zhāo hū", "mean": "chào hỏi"},
    {"hanzi": "打折", "pinyin": "dǎ zhé", "mean": "giảm giá"},
    {"hanzi": "打针", "pinyin": "dǎ zhēn", "mean": "tiêm"},
    {"hanzi": "大概", "pinyin": "dà gài", "mean": "khoảng"},
    {"hanzi": "大使馆", "pinyin": "dà shǐ guǎn", "mean": "đại sứ quán"},
    {"hanzi": "大约", "pinyin": "dà yuē", "mean": "khoảng"},
    {"hanzi": "大夫", "pinyin": "dài fū", "mean": "bác sĩ, đại phu"},
    {"hanzi": "戴", "pinyin": "dài", "mean": "đeo"},
    {"hanzi": "当", "pinyin": "dāng", "mean": "làm"},
    {"hanzi": "当时", "pinyin": "dāng shí", "mean": "lúc đó"},
    {"hanzi": "刀", "pinyin": "dāo", "mean": "cái dao"},
    {"hanzi": "导游", "pinyin": "dǎo yóu", "mean": "hướng dẫn viên du lịch"},
    {"hanzi": "到处", "pinyin": "dào chù", "mean": "khắp nơi"},
    {"hanzi": "到底", "pinyin": "dào dǐ", "mean": "cuối cùng"},
    {"hanzi": "倒", "pinyin": "dǎo", "mean": "đổ, ngã"},
    {"hanzi": "道歉", "pinyin": "dào qiàn", "mean": "xin lỗi"},
    {"hanzi": "得意", "pinyin": "dé yì", "mean": "đắc ý"},
    {"hanzi": "得（助动词）", "pinyin": "de （ zhù dòng cí ）", "mean": "trợ từ"},
    {"hanzi": "登机牌", "pinyin": "dēng jī pái", "mean": "thẻ lên tàu"},
    {"hanzi": "等（助词）", "pinyin": "děng （ zhù cí ）", "mean": "vân vân"},
    {"hanzi": "低", "pinyin": "dī", "mean": "thấp"},
    {"hanzi": "底", "pinyin": "dǐ", "mean": "đáy"},
    {"hanzi": "地点", "pinyin": "dì diǎn", "mean": "địa điểm"},
    {"hanzi": "地球", "pinyin": "dì qiú", "mean": "địa cầu"},
    {"hanzi": "地址", "pinyin": "dì zhǐ", "mean": "địa chỉ"},
    {"hanzi": "调查", "pinyin": "diào chá", "mean": "điều tra"},
    {"hanzi": "掉", "pinyin": "diào", "mean": "rơi"},
    {"hanzi": "丢", "pinyin": "diū", "mean": "mất"},
    {"hanzi": "动作", "pinyin": "dòng zuò", "mean": "động tác"},
    {"hanzi": "堵车", "pinyin": "dǔ chē", "mean": "tắc đường"},
    {"hanzi": "肚子", "pinyin": "dù zi", "mean": "bụng"},
    {"hanzi": "短信", "pinyin": "duǎn xìn", "mean": "tin nhắn"},
    {"hanzi": "对话", "pinyin": "duì huà", "mean": "hội thoại, đối thoại"},
    {"hanzi": "对面", "pinyin": "duì miàn", "mean": "đối diện"},
    {"hanzi": "对于", "pinyin": "duì yú", "mean": "về (vấn đề gì đó)"},
    {"hanzi": "儿童", "pinyin": "ér tóng", "mean": "trẻ con"},
    {"hanzi": "而", "pinyin": "ér", "mean": "còn"},
    {"hanzi": "发生", "pinyin": "fā shēng", "mean": "xảy ra"},
    {"hanzi": "发展", "pinyin": "fā zhǎn", "mean": "phát triển"},
    {"hanzi": "法律", "pinyin": "fǎ lǜ", "mean": "pháp luật"},
    {"hanzi": "翻译", "pinyin": "fān yì", "mean": "phiên dịch"},
    {"hanzi": "烦恼", "pinyin": "fán nǎo", "mean": "phiền não"},
    {"hanzi": "反对", "pinyin": "fǎn duì", "mean": "phản đối"},
    {"hanzi": "方法", "pinyin": "fāng fǎ", "mean": "phương pháp"},
    {"hanzi": "方面", "pinyin": "fāng miàn", "mean": "phương diện"},
    {"hanzi": "方向", "pinyin": "fāng xiàng", "mean": "phương hướng"},
    {"hanzi": "房东", "pinyin": "fáng dōng", "mean": "chủ nhà"},
    {"hanzi": "放弃", "pinyin": "fàng qì", "mean": "vứt bỏ, từ bỏ"},
    {"hanzi": "放暑假", "pinyin": "fàng shǔ jià", "mean": "nghỉ hè"},
    {"hanzi": "放松", "pinyin": "fàng sōng", "mean": "thư giãn"},
    {"hanzi": "份", "pinyin": "fèn", "mean": "phần"},
    {"hanzi": "丰富", "pinyin": "fēng fù", "mean": "phong phú"},
    {"hanzi": "否则", "pinyin": "fǒu zé", "mean": "nếu không thì"},
    {"hanzi": "符合", "pinyin": "fú hé", "mean": "phù hợp"},
    {"hanzi": "父亲", "pinyin": "fù qīn", "mean": "bố"},
    {"hanzi": "付款", "pinyin": "fù kuǎn", "mean": "thanh toán"},
    {"hanzi": "负责", "pinyin": "fù zé", "mean": "phụ trách"},
    {"hanzi": "复印", "pinyin": "fù yìn", "mean": "phô tô"},
    {"hanzi": "复杂", "pinyin": "fù zá", "mean": "phức tạp"},
    {"hanzi": "富", "pinyin": "fù", "mean": "giàu"},
    {"hanzi": "改变", "pinyin": "gǎi biàn", "mean": "thay đổi"},
    {"hanzi": "干杯", "pinyin": "gān bēi", "mean": "cạn ly"},
    {"hanzi": "赶", "pinyin": "gǎn", "mean": "đuổi theo"},
    {"hanzi": "敢", "pinyin": "gǎn", "mean": "dám"},
    {"hanzi": "感动", "pinyin": "gǎn dòng", "mean": "cảm động"},
    {"hanzi": "感觉", "pinyin": "gǎn jué", "mean": "cảm giác"},
    {"hanzi": "感情", "pinyin": "gǎn qíng", "mean": "tình cảm"},
    {"hanzi": "感谢", "pinyin": "gǎn xiè", "mean": "cảm ơn"},
    {"hanzi": "干", "pinyin": "gān", "mean": "khô"},
    {"hanzi": "刚", "pinyin": "gāng", "mean": "vừa mới"},
    {"hanzi": "高速公路", "pinyin": "gāo sù gōng lù", "mean": "đường cao tốc"},
    {"hanzi": "胳膊", "pinyin": "gē bo", "mean": "cánh tay"},
    {"hanzi": "各", "pinyin": "gè", "mean": "các"},
    {"hanzi": "工资", "pinyin": "gōng zī", "mean": "lương"},
    {"hanzi": "公里", "pinyin": "gōng lǐ", "mean": "km"},
    {"hanzi": "功夫", "pinyin": "gōng fū", "mean": "công phu"},
    {"hanzi": "共同", "pinyin": "gòng tóng", "mean": "giống nhau"},
    {"hanzi": "购物", "pinyin": "gòu wù", "mean": "mua sắm"},
    {"hanzi": "够", "pinyin": "gòu", "mean": "đủ"},
    {"hanzi": "估计", "pinyin": "gū jì", "mean": "ước lượng"},
    {"hanzi": "鼓励", "pinyin": "gǔ lì", "mean": "cổ vũ"},
    {"hanzi": "故意", "pinyin": "gù yì", "mean": "cố ý"},
    {"hanzi": "顾客", "pinyin": "gù kè", "mean": "khách hàng"},
    {"hanzi": "挂", "pinyin": "guà", "mean": "treo, ngắt điện thoại"},
    {"hanzi": "关键", "pinyin": "guān jiàn", "mean": "mấu chốt"},
    {"hanzi": "观众", "pinyin": "guān zhòng", "mean": "khán giả"},
    {"hanzi": "管理", "pinyin": "guǎn lǐ", "mean": "quản lý"},
    {"hanzi": "光", "pinyin": "guāng", "mean": "chỉ, hết"},
    {"hanzi": "广播", "pinyin": "guǎng bō", "mean": "phát thanh"},
    {"hanzi": "广告", "pinyin": "guǎng gào", "mean": "quảng cáo"},
    {"hanzi": "逛", "pinyin": "guàng", "mean": "đi dạo"},
    {"hanzi": "规定", "pinyin": "guī dìng", "mean": "qui định"},
    {"hanzi": "国籍", "pinyin": "guó jí", "mean": "quốc tịch"},
    {"hanzi": "国际", "pinyin": "guó jì", "mean": "quốc tế"},
    {"hanzi": "果汁", "pinyin": "guǒ zhī", "mean": "nước hoa quả"},
    {"hanzi": "过程", "pinyin": "guò chéng", "mean": "quá trình"},
    {"hanzi": "海洋", "pinyin": "hǎi yáng", "mean": "đại dương"},
    {"hanzi": "害羞", "pinyin": "hài xiū", "mean": "xấu hổ"},
    {"hanzi": "寒假", "pinyin": "hán jià", "mean": "kì nghỉ đông"},
    {"hanzi": "汗", "pinyin": "hàn", "mean": "mồ hôi"},
    {"hanzi": "航班", "pinyin": "háng bān", "mean": "chuyến bay"},
    {"hanzi": "好处", "pinyin": "hǎo chù", "mean": "cái tốt"},
    {"hanzi": "好像", "pinyin": "hǎo xiàng", "mean": "dường như"},
    {"hanzi": "号码", "pinyin": "hào mǎ", "mean": "số"},
    {"hanzi": "合格", "pinyin": "hé gé", "mean": "đạt yêu cầu"},
    {"hanzi": "合适", "pinyin": "hé shì", "mean": "thích hợp"},
    {"hanzi": "盒子", "pinyin": "hé zi", "mean": "cái hộp"},
    {"hanzi": "后悔", "pinyin": "hòu huǐ", "mean": "hối hận"},
    {"hanzi": "厚", "pinyin": "hòu", "mean": "dày"},
    {"hanzi": "互联网", "pinyin": "hù lián wǎng", "mean": "mạng internet"},
    {"hanzi": "互相", "pinyin": "hù xiāng", "mean": "lẫn nhau"},
    {"hanzi": "护士", "pinyin": "hù shì", "mean": "y tá"},
    {"hanzi": "怀疑", "pinyin": "huái yí", "mean": "nghi ngờ"},
    {"hanzi": "回忆", "pinyin": "huí yì", "mean": "hồi ức, nhớ lại"},
    {"hanzi": "活动", "pinyin": "huó dòng", "mean": "hoạt động"},
    {"hanzi": "活泼", "pinyin": "huó pō", "mean": "hoạt bát"},
    {"hanzi": "火", "pinyin": "huǒ", "mean": "lửa"},
    {"hanzi": "获得", "pinyin": "huò dé", "mean": "giành được"},
    {"hanzi": "积极", "pinyin": "jī jí", "mean": "tích cực"},
    {"hanzi": "积累", "pinyin": "jī lěi", "mean": "tích lũy"},
    {"hanzi": "基础", "pinyin": "jī chǔ", "mean": "cơ sở, căn bản"},
    {"hanzi": "激动", "pinyin": "jī dòng", "mean": "xúc động"},
    {"hanzi": "及时", "pinyin": "jí shí", "mean": "kịp thời"},
    {"hanzi": "即使", "pinyin": "jí shǐ", "mean": "cho dù"},
    {"hanzi": "计划", "pinyin": "jì huà", "mean": "kế hoạch"},
    {"hanzi": "记者", "pinyin": "jì zhě", "mean": "phóng viên"},
    {"hanzi": "技术", "pinyin": "jì shù", "mean": "kỹ thuật"},
    {"hanzi": "既然", "pinyin": "jì rán", "mean": "đã…."},
    {"hanzi": "继续", "pinyin": "jì xù", "mean": "tiếp tục"},
    {"hanzi": "寄", "pinyin": "jì", "mean": "gửi"},
    {"hanzi": "加班", "pinyin": "jiā bān", "mean": "tăng ca"},
    {"hanzi": "加油站", "pinyin": "jiā yóu zhàn", "mean": "cây xăng"},
    {"hanzi": "家具", "pinyin": "jiā jù", "mean": "đồ gia dụng"},
    {"hanzi": "假", "pinyin": "jiǎ", "mean": "giả"},
    {"hanzi": "价格", "pinyin": "jià gé", "mean": "giá cả"},
    {"hanzi": "坚持", "pinyin": "jiān chí", "mean": "kiên trì"},
    {"hanzi": "减肥", "pinyin": "jiǎn féi", "mean": "giảm béo"},
    {"hanzi": "减少", "pinyin": "jiǎn shǎo", "mean": "cắt giảm"},
    {"hanzi": "建议", "pinyin": "jiàn yì", "mean": "kiến nghị"},
    {"hanzi": "将来", "pinyin": "jiāng lái", "mean": "tương lai"},
    {"hanzi": "奖金", "pinyin": "jiǎng jīn", "mean": "học bổng"},
    {"hanzi": "降低", "pinyin": "jiàng dī", "mean": "hạ thấp"},
    {"hanzi": "降落", "pinyin": "jiàng luò", "mean": "hạ cánh"},
    {"hanzi": "交", "pinyin": "jiāo", "mean": "giao"},
    {"hanzi": "交流", "pinyin": "jiāo liú", "mean": "giao lưu"},
    {"hanzi": "交通", "pinyin": "jiāo tōng", "mean": "giao thông"},
    {"hanzi": "郊区", "pinyin": "jiāo qū", "mean": "ngoại ô"},
    {"hanzi": "骄傲", "pinyin": "jiāo ào", "mean": "tự hào, kiêu ngạo"},
    {"hanzi": "饺子", "pinyin": "jiǎo zi", "mean": "sủi cảo"},
    {"hanzi": "教授", "pinyin": "jiào shòu", "mean": "giáo sư"},
    {"hanzi": "教育", "pinyin": "jiào yù", "mean": "giáo dục"},
    {"hanzi": "接受", "pinyin": "jiē shòu", "mean": "tiếp nhận"},
    {"hanzi": "接着", "pinyin": "jiē zhe", "mean": "tiếp theo"},
    {"hanzi": "节", "pinyin": "jié", "mean": "tiết"},
    {"hanzi": "节约", "pinyin": "jié yuē", "mean": "tiết kiệm"},
    {"hanzi": "结果", "pinyin": "jié guǒ", "mean": "kết quả"},
    {"hanzi": "解释", "pinyin": "jiě shì", "mean": "giải thích"},
    {"hanzi": "尽管", "pinyin": "jǐn guǎn", "mean": "tuy rằng"},
    {"hanzi": "紧张", "pinyin": "jǐn zhāng", "mean": "căng thẳng"},
    {"hanzi": "进行", "pinyin": "jìn xíng", "mean": "tiến hành"},
    {"hanzi": "禁止", "pinyin": "jìn zhǐ", "mean": "cấm"},
    {"hanzi": "京剧", "pinyin": "jīng jù", "mean": "kinh kịch"},
    {"hanzi": "经济", "pinyin": "jīng jì", "mean": "kinh tế"},
    {"hanzi": "经历", "pinyin": "jīng lì", "mean": "trải qua, kinh qua"},
    {"hanzi": "经验", "pinyin": "jīng yàn", "mean": "kinh nghiệm"},
    {"hanzi": "精彩", "pinyin": "jīng cǎi", "mean": "hấp dẫn"},
    {"hanzi": "景色", "pinyin": "jǐng sè", "mean": "cảnh sắc"},
    {"hanzi": "警察", "pinyin": "jǐng chá", "mean": "cảnh sát"},
    {"hanzi": "竞争", "pinyin": "jìng zhēng", "mean": "cạnh tranh"},
    {"hanzi": "竟然", "pinyin": "jìng rán", "mean": "vậy mà lại"},
    {"hanzi": "镜子", "pinyin": "jìng zi", "mean": "kính, gương"},
    {"hanzi": "究竟", "pinyin": "jiū jìng", "mean": "rốt cuộc"},
    {"hanzi": "举", "pinyin": "jǔ", "mean": "giơ, nâng"},
    {"hanzi": "举办", "pinyin": "jǔ bàn", "mean": "tổ chức"},
    {"hanzi": "举行", "pinyin": "jǔ xíng", "mean": "tổ chức"},
    {"hanzi": "拒绝", "pinyin": "jù jué", "mean": "từ chối"},
    {"hanzi": "距离", "pinyin": "jù lí", "mean": "khoảng cách"},
    {"hanzi": "聚会", "pinyin": "jù huì", "mean": "tụ tập"},
    {"hanzi": "开玩笑", "pinyin": "kāi wán xiào", "mean": "đùa"},
    {"hanzi": "开心", "pinyin": "kāi xīn", "mean": "vui vẻ"},
    {"hanzi": "看法", "pinyin": "kàn fǎ", "mean": "quan điểm"},
    {"hanzi": "考虑", "pinyin": "kǎo lǜ", "mean": "suy nghĩ"},
    {"hanzi": "烤鸭", "pinyin": "kǎo yā", "mean": "vịt quay"},
    {"hanzi": "科学", "pinyin": "kē xué", "mean": "khoa học"},
    {"hanzi": "棵", "pinyin": "kē", "mean": "lượng từ cho cây"},
    {"hanzi": "咳嗽", "pinyin": "ké sou", "mean": "ho"},
    {"hanzi": "可怜", "pinyin": "kě lián", "mean": "đáng thương"},
    {"hanzi": "可是", "pinyin": "kě shì", "mean": "nhưng"},
    {"hanzi": "可惜", "pinyin": "kě xī", "mean": "đáng tiếc"},
    {"hanzi": "客厅", "pinyin": "kè tīng", "mean": "phòng khách"},
    {"hanzi": "肯定", "pinyin": "kěn dìng", "mean": "khẳng định"},
    {"hanzi": "空", "pinyin": "kōng", "mean": "trống rỗng"},
    {"hanzi": "空气", "pinyin": "kōng qì", "mean": "không khí"},
    {"hanzi": "恐怕", "pinyin": "kǒng pà", "mean": "e rằng"},
    {"hanzi": "苦", "pinyin": "kǔ", "mean": "khổ, đắng"},
    {"hanzi": "矿泉水", "pinyin": "kuàng quán shuǐ", "mean": "nước khoáng"},
    {"hanzi": "困", "pinyin": "kùn", "mean": "buồn ngủ"},
    {"hanzi": "困难", "pinyin": "kùn nán", "mean": "khó khăn"},
    {"hanzi": "垃圾桶", "pinyin": "lā jī tǒng", "mean": "thùng rác"},
    {"hanzi": "拉", "pinyin": "lā", "mean": "kéo"},
    {"hanzi": "辣", "pinyin": "là", "mean": "cay"},
    {"hanzi": "来不及", "pinyin": "lái bù jí", "mean": "không kịp"},
    {"hanzi": "来得及", "pinyin": "lái de jí", "mean": "kịp"},
    {"hanzi": "来自", "pinyin": "lái zì", "mean": "đến từ"},
    {"hanzi": "懒", "pinyin": "lǎn", "mean": "lười biếng"},
    {"hanzi": "浪费", "pinyin": "làng fèi", "mean": "lãng phí"},
    {"hanzi": "浪漫", "pinyin": "làng màn", "mean": "lãng mạn"},
    {"hanzi": "老虎", "pinyin": "lǎo hǔ", "mean": "hổ"},
    {"hanzi": "冷静", "pinyin": "lěng jìng", "mean": "bình tĩnh"},
    {"hanzi": "礼拜天", "pinyin": "lǐ bài tiān", "mean": "chủ nhật"},
    {"hanzi": "礼貌", "pinyin": "lǐ mào", "mean": "lễ phép, lịch sự"},
    {"hanzi": "理发", "pinyin": "lǐ fà", "mean": "cắt tóc"},
    {"hanzi": "理解", "pinyin": "lǐ jiě", "mean": "lý giải, hiểu"},
    {"hanzi": "理想", "pinyin": "lǐ xiǎng", "mean": "lý tưởng"},
    {"hanzi": "力气", "pinyin": "lì qì", "mean": "sức lực"},
    {"hanzi": "厉害", "pinyin": "lì hài", "mean": "lợi hại"},
    {"hanzi": "例如", "pinyin": "lì rú", "mean": "ví dụ"},
    {"hanzi": "俩", "pinyin": "liǎ", "mean": "hai người"},
    {"hanzi": "连", "pinyin": "lián", "mean": "liên kết, nối"},
    {"hanzi": "联系", "pinyin": "lián xì", "mean": "liên hệ"},
    {"hanzi": "凉快", "pinyin": "liáng kuài", "mean": "mát mẻ"},
    {"hanzi": "零钱", "pinyin": "líng qián", "mean": "tiền lẻ"},
    {"hanzi": "另外", "pinyin": "lìng wài", "mean": "ngoài ra, còn lại"},
    {"hanzi": "留", "pinyin": "liú", "mean": "lưu lại, ở lại"},
    {"hanzi": "流利", "pinyin": "liú lì", "mean": "lưu loát"},
    {"hanzi": "流行", "pinyin": "liú xíng", "mean": "thịnh hành"},
    {"hanzi": "旅行", "pinyin": "lǚ xíng", "mean": "du lịch"},
    {"hanzi": "律师", "pinyin": "lǜ shī", "mean": "luật sư"},
    {"hanzi": "乱", "pinyin": "luàn", "mean": "loạn"},
    {"hanzi": "麻烦", "pinyin": "má fan", "mean": "phiền phức, làm phiền"},
    {"hanzi": "马虎", "pinyin": "mǎ hu", "mean": "qua loa"},
    {"hanzi": "满", "pinyin": "mǎn", "mean": "đầy"},
    {"hanzi": "毛", "pinyin": "máo", "mean": "lông"},
    {"hanzi": "毛巾", "pinyin": "máo jīn", "mean": "khăn bông"},
    {"hanzi": "美丽", "pinyin": "měi lì", "mean": "đẹp"},
    {"hanzi": "梦", "pinyin": "mèng", "mean": "giấc mơ, mơ"},
    {"hanzi": "迷路", "pinyin": "mí lù", "mean": "lạc đường"},
    {"hanzi": "密码", "pinyin": "mì mǎ", "mean": "mật khẩu"},
    {"hanzi": "免费", "pinyin": "miǎn fèi", "mean": "miễn phí"},
    {"hanzi": "秒", "pinyin": "miǎo", "mean": "giây"},
    {"hanzi": "民族", "pinyin": "mín zú", "mean": "dân tộc"},
    {"hanzi": "母亲", "pinyin": "mǔ qin", "mean": "mẹ"},
    {"hanzi": "目的", "pinyin": "mù dì", "mean": "mục đích"},
    {"hanzi": "耐心", "pinyin": "nài xīn", "mean": "nhẫn nại"},
    {"hanzi": "难道", "pinyin": "nán dào", "mean": "lẽ nào"},
    {"hanzi": "难受", "pinyin": "nán shòu", "mean": "buồn"},
    {"hanzi": "内", "pinyin": "nèi", "mean": "bên trong"},
    {"hanzi": "内容", "pinyin": "nèi róng", "mean": "nội dung"},
    {"hanzi": "能力", "pinyin": "néng lì", "mean": "năng lực"},
    {"hanzi": "年龄", "pinyin": "nián líng", "mean": "tuổi tác"},
    {"hanzi": "弄", "pinyin": "nòng", "mean": "làm"},
    {"hanzi": "暖和", "pinyin": "nuǎn huo", "mean": "ấm áp"},
    {"hanzi": "偶尔", "pinyin": "ǒu ěr", "mean": "đôi khi"},
    {"hanzi": "排队", "pinyin": "pái duì", "mean": "xếp hàng"},
    {"hanzi": "排列", "pinyin": "pái liè", "mean": "sắp xếp, xếp"},
    {"hanzi": "判断", "pinyin": "pàn duàn", "mean": "phán đoán"},
    {"hanzi": "陪", "pinyin": "péi", "mean": "cùng"},
    {"hanzi": "批评", "pinyin": "pī píng", "mean": "phê bình"},
    {"hanzi": "皮肤", "pinyin": "pí fū", "mean": "da"},
    {"hanzi": "脾气", "pinyin": "pí qì", "mean": "tính khí"},
    {"hanzi": "篇", "pinyin": "piān", "mean": "lượng từ cho bài viết"},
    {"hanzi": "骗", "pinyin": "piàn", "mean": "lừa"},
    {"hanzi": "乒乓球", "pinyin": "pīng pāng qiú", "mean": "bóng bàn"},
    {"hanzi": "平时", "pinyin": "píng shí", "mean": "bình thường"},
    {"hanzi": "破", "pinyin": "pò", "mean": "rách, nổ"},
    {"hanzi": "葡萄", "pinyin": "pú táo", "mean": "nho"},
    {"hanzi": "普遍", "pinyin": "pǔ biàn", "mean": "phổ biến"},
    {"hanzi": "普通话", "pinyin": "pǔ tōng huà", "mean": "tiếng phổ thông"},
    {"hanzi": "其次", "pinyin": "qí cì", "mean": "tiếp theo"},
    {"hanzi": "其中", "pinyin": "qí zhōng", "mean": "trong đó"},
    {"hanzi": "气候", "pinyin": "qì hòu", "mean": "khí hậu"},
    {"hanzi": "千万", "pinyin": "qiān wàn", "mean": "nhất thiết"},
    {"hanzi": "签证", "pinyin": "qiān zhèng", "mean": "visa"},
    {"hanzi": "敲", "pinyin": "qiāo", "mean": "gõ"},
    {"hanzi": "桥", "pinyin": "qiáo", "mean": "cầu"},
    {"hanzi": "巧克力", "pinyin": "qiǎo kè lì", "mean": "sô cô la"},
    {"hanzi": "亲戚", "pinyin": "qīn qi", "mean": "họ hàng"},
    {"hanzi": "轻", "pinyin": "qīng", "mean": "nhẹ"},
    {"hanzi": "轻松", "pinyin": "qīng sōng", "mean": "thoải mái"},
    {"hanzi": "情况", "pinyin": "qíng kuàng", "mean": "tình hình"},
    {"hanzi": "穷", "pinyin": "qióng", "mean": "nghèo"},
    {"hanzi": "区别", "pinyin": "qū bié", "mean": "khác biệt"},
    {"hanzi": "取", "pinyin": "qǔ", "mean": "lấy"},
    {"hanzi": "全部", "pinyin": "quán bù", "mean": "toàn bộ"},
    {"hanzi": "缺点", "pinyin": "quē diǎn", "mean": "khuyết điểm"},
    {"hanzi": "缺少", "pinyin": "quē shǎo", "mean": "thiếu"},
    {"hanzi": "却", "pinyin": "què", "mean": "lại, nhưng"},
    {"hanzi": "确实", "pinyin": "què shí", "mean": "thật sự"},
    {"hanzi": "然而", "pinyin": "rán ér", "mean": "vậy mà"},
    {"hanzi": "热闹", "pinyin": "rè nào", "mean": "náo nhiệt"},
    {"hanzi": "任何", "pinyin": "rèn hé", "mean": "bất kì"},
    {"hanzi": "任务", "pinyin": "rèn wù", "mean": "nhiệm vụ"},
    {"hanzi": "扔", "pinyin": "rēng", "mean": "ném"},
    {"hanzi": "仍然", "pinyin": "réng rán", "mean": "vẫn"},
    {"hanzi": "日记", "pinyin": "rì jì", "mean": "nhật kí"},
    {"hanzi": "入口", "pinyin": "rù kǒu", "mean": "cửa vào"},
    {"hanzi": "散步", "pinyin": "sàn bù", "mean": "tản bộ"},
    {"hanzi": "森林", "pinyin": "sēn lín", "mean": "rừng sâu"},
    {"hanzi": "沙发", "pinyin": "shā fā", "mean": "ghế sô pha"},
    {"hanzi": "伤心", "pinyin": "shāng xīn", "mean": "tổn thương"},
    {"hanzi": "商量", "pinyin": "shāng liáng", "mean": "thương lượng, bàn bạc"},
    {"hanzi": "稍微", "pinyin": "shāo wēi", "mean": "một chút"},
    {"hanzi": "勺子", "pinyin": "sháo zi", "mean": "cái thìa"},
    {"hanzi": "社会", "pinyin": "shè huì", "mean": "xã hội"},
    {"hanzi": "申请", "pinyin": "shēn qǐng", "mean": "xin"},
    {"hanzi": "深", "pinyin": "shēn", "mean": "sâu"},
    {"hanzi": "甚至", "pinyin": "shèn zhì", "mean": "thậm chí"},
    {"hanzi": "生活", "pinyin": "shēng huó", "mean": "cuộc sống"},
    {"hanzi": "生命", "pinyin": "shēng mìng", "mean": "tính mạng"},
    {"hanzi": "生意", "pinyin": "shēng yì", "mean": "kinh doanh"},
    {"hanzi": "省", "pinyin": "shěng", "mean": "tỉnh thành"},
    {"hanzi": "剩", "pinyin": "shèng", "mean": "thừa"},
    {"hanzi": "失败", "pinyin": "shī bài", "mean": "thất bại"},
    {"hanzi": "失望", "pinyin": "shī wàng", "mean": "thất vọng"},
    {"hanzi": "师傅", "pinyin": "shī fù", "mean": "sư phụ"},
    {"hanzi": "十分", "pinyin": "shí fēn", "mean": "vô cùng"},
    {"hanzi": "实际", "pinyin": "shí jì", "mean": "thực tế"},
    {"hanzi": "实在", "pinyin": "shí zài", "mean": "thật sự"},
    {"hanzi": "使", "pinyin": "shǐ", "mean": "khiến cho"},
    {"hanzi": "使用", "pinyin": "shǐ yòng", "mean": "sử dụng"},
    {"hanzi": "世纪", "pinyin": "shì jì", "mean": "thế kỉ"},
    {"hanzi": "是否", "pinyin": "shì fǒu", "mean": "liệu có phải"},
    {"hanzi": "适合", "pinyin": "shì hé", "mean": "thích hợp"},
    {"hanzi": "适应", "pinyin": "shì yìng", "mean": "thích nghi"},
    {"hanzi": "收", "pinyin": "shōu", "mean": "nhận"},
    {"hanzi": "收入", "pinyin": "shōu rù", "mean": "thu nhập"},
    {"hanzi": "收拾", "pinyin": "shōu shí", "mean": "dọn dẹp"},
    {"hanzi": "首都", "pinyin": "shǒu dū", "mean": "thủ đô"},
    {"hanzi": "首先", "pinyin": "shǒu xiān", "mean": "đầu tiên"},
    {"hanzi": "受不了", "pinyin": "shòu bù liǎo", "mean": "không chịu nổi"},
    {"hanzi": "受到", "pinyin": "shòu dào", "mean": "nhận được"},
    {"hanzi": "售货员", "pinyin": "shòu huò yuán", "mean": "nhân viên bán vé"},
    {"hanzi": "输", "pinyin": "shū", "mean": "thua"},
    {"hanzi": "熟悉", "pinyin": "shú xī", "mean": "quen thuộc"},
    {"hanzi": "数量", "pinyin": "shù liàng", "mean": "số lượng"},
    {"hanzi": "数字", "pinyin": "shù zi", "mean": "con cố"},
    {"hanzi": "帅", "pinyin": "shuài", "mean": "đẹp trai"},
    {"hanzi": "顺便", "pinyin": "shùn biàn", "mean": "nhân tiện"},
    {"hanzi": "顺利", "pinyin": "shùn lì", "mean": "thuận lợi"},
    {"hanzi": "顺序", "pinyin": "shùn xù", "mean": "thứ tự"},
    {"hanzi": "说明", "pinyin": "shuō míng", "mean": "nói rõ"},
    {"hanzi": "硕士", "pinyin": "shuò shì", "mean": "thạc sĩ"},
    {"hanzi": "死", "pinyin": "sǐ", "mean": "chết"},
    {"hanzi": "速度", "pinyin": "sù dù", "mean": "tốc độ"},
    {"hanzi": "塑料袋", "pinyin": "sù liào dài", "mean": "túi ni lông"},
    {"hanzi": "酸", "pinyin": "suān", "mean": "chua"},
    {"hanzi": "随便", "pinyin": "suí biàn", "mean": "tùy tiện, tự nhiên"},
    {"hanzi": "随着", "pinyin": "suí zhe", "mean": "cùng với"},
    {"hanzi": "孙子", "pinyin": "sūn zi", "mean": "cháu trai"},
    {"hanzi": "所有", "pinyin": "suǒ yǒu", "mean": "tất cả"},
    {"hanzi": "台", "pinyin": "tái", "mean": "cái, chiếc"},
    {"hanzi": "抬", "pinyin": "tái", "mean": "ngẩng"},
    {"hanzi": "态度", "pinyin": "tài dù", "mean": "thái độ"},
    {"hanzi": "谈", "pinyin": "tán", "mean": "nói chuyện"},
    {"hanzi": "弹钢琴", "pinyin": "tán gāng qín", "mean": "chơi piano"},
    {"hanzi": "汤", "pinyin": "tāng", "mean": "canh"},
    {"hanzi": "糖", "pinyin": "táng", "mean": "đường"},
    {"hanzi": "躺", "pinyin": "tǎng", "mean": "nằm"},
    {"hanzi": "趟", "pinyin": "tàng", "mean": "chuyến"},
    {"hanzi": "讨论", "pinyin": "tǎo lùn", "mean": "thảo luận"},
    {"hanzi": "讨厌", "pinyin": "tǎo yàn", "mean": "ghét"},
    {"hanzi": "特点", "pinyin": "tè diǎn", "mean": "đặc điểm"},
    {"hanzi": "提", "pinyin": "tí", "mean": "đề ra"},
    {"hanzi": "提供", "pinyin": "tí gōng", "mean": "cung cấp"},
    {"hanzi": "提前", "pinyin": "tí qián", "mean": "trước thời hạn"},
    {"hanzi": "提醒", "pinyin": "tí xǐng", "mean": "nhắc nhở"},
    {"hanzi": "填空", "pinyin": "tián kòng", "mean": "điền trống"},
    {"hanzi": "条件", "pinyin": "tiáo jiàn", "mean": "điều kiện"},
    {"hanzi": "停", "pinyin": "tíng", "mean": "dừng"},
    {"hanzi": "挺", "pinyin": "tǐng", "mean": "rất"},
    {"hanzi": "通过", "pinyin": "tōng guò", "mean": "thông qua"},
    {"hanzi": "通知", "pinyin": "tōng zhī", "mean": "thông báo"},
    {"hanzi": "同情", "pinyin": "tóng qíng", "mean": "đồng tình"},
    {"hanzi": "同时", "pinyin": "tóng shí", "mean": "đồng thời"},
    {"hanzi": "推", "pinyin": "tuī", "mean": "đẩy"},
    {"hanzi": "推迟", "pinyin": "tuī chí", "mean": "kéo dài thời gian"},
    {"hanzi": "脱", "pinyin": "tuō", "mean": "cởi"},
    {"hanzi": "袜子", "pinyin": "wà zi", "mean": "tất chân"},
    {"hanzi": "完全", "pinyin": "wán quán", "mean": "hoàn toàn"},
    {"hanzi": "网球", "pinyin": "wǎng qiú", "mean": "tennis"},
    {"hanzi": "网站", "pinyin": "wǎng zhàn", "mean": "trang mạng"},
    {"hanzi": "往往", "pinyin": "wǎng wǎng", "mean": "thường (quá khứ)"},
    {"hanzi": "危险", "pinyin": "wēi xiǎn", "mean": "nguy hiểm"},
    {"hanzi": "卫生间", "pinyin": "wèi shēng jiān", "mean": "phòng vệ sinh"},
    {"hanzi": "味道", "pinyin": "wèi dào", "mean": "mùi vị"},
    {"hanzi": "温度", "pinyin": "wēn dù", "mean": "nhiệt độ"},
    {"hanzi": "文章", "pinyin": "wén zhāng", "mean": "bài văn"},
    {"hanzi": "污染", "pinyin": "wū rǎn", "mean": "ô nhiễm"},
    {"hanzi": "无", "pinyin": "wú", "mean": "không"},
    {"hanzi": "无聊", "pinyin": "wú liáo", "mean": "nhàm chán"},
    {"hanzi": "无论", "pinyin": "wú lùn", "mean": "bất luận"},
    {"hanzi": "误会", "pinyin": "wù huì", "mean": "hiểu lầm"},
    {"hanzi": "西红柿", "pinyin": "xī hóng shì", "mean": "cà chua"},
    {"hanzi": "吸引", "pinyin": "xī yǐn", "mean": "thu hút"},
    {"hanzi": "咸", "pinyin": "xián", "mean": "mặn"},
    {"hanzi": "现金", "pinyin": "xiàn jīn", "mean": "tiền mặt"},
    {"hanzi": "羡慕", "pinyin": "xiàn mù", "mean": "ngưỡng mộ"},
    {"hanzi": "相反", "pinyin": "xiāng fǎn", "mean": "ngược lại"},
    {"hanzi": "相同", "pinyin": "xiāng tóng", "mean": "giống nhau"},
    {"hanzi": "香", "pinyin": "xiāng", "mean": "thơm"},
    {"hanzi": "详细", "pinyin": "xiáng xì", "mean": "tỉ mỉ"},
    {"hanzi": "响", "pinyin": "xiǎng", "mean": "kêu"},
    {"hanzi": "橡皮", "pinyin": "xiàng pí", "mean": "cục tẩy"},
    {"hanzi": "消息", "pinyin": "xiāo xi", "mean": "thông tin, tin"},
    {"hanzi": "小吃", "pinyin": "xiǎo chī", "mean": "đồ ăn vặt"},
    {"hanzi": "小伙子", "pinyin": "xiǎo huǒ zi", "mean": "anh chàng"},
    {"hanzi": "小说", "pinyin": "xiǎo shuō", "mean": "tiểu thuyết"},
    {"hanzi": "笑话", "pinyin": "xiào huà", "mean": "truyện cười"},
    {"hanzi": "效果", "pinyin": "xiào guǒ", "mean": "hiệu quả"},
    {"hanzi": "心情", "pinyin": "xīn qíng", "mean": "tâm trạng"},
    {"hanzi": "辛苦", "pinyin": "xīn kǔ", "mean": "vất vả"},
    {"hanzi": "信封", "pinyin": "xìn fēng", "mean": "bức thư"},
    {"hanzi": "信息", "pinyin": "xìn xī", "mean": "thông tin"},
    {"hanzi": "信心", "pinyin": "xìn xīn", "mean": "niềm tin"},
    {"hanzi": "兴奋", "pinyin": "xīng fèn", "mean": "hưng phấn, hứng khởi"},
    {"hanzi": "行", "pinyin": "xíng", "mean": "được"},
    {"hanzi": "醒", "pinyin": "xǐng", "mean": "tỉnh"},
    {"hanzi": "幸福", "pinyin": "xìng fú", "mean": "hạnh phúc"},
    {"hanzi": "性别", "pinyin": "xìng bié", "mean": "giới tính"},
    {"hanzi": "性格", "pinyin": "xìng gé", "mean": "tính cách"},
    {"hanzi": "修理", "pinyin": "xiū lǐ", "mean": "sửa chữa"},
    {"hanzi": "许多", "pinyin": "xǔ duō", "mean": "rất nhiều"},
    {"hanzi": "学期", "pinyin": "xué qī", "mean": "học kì"},
    {"hanzi": "压力", "pinyin": "yā lì", "mean": "áp lực"},
    {"hanzi": "呀", "pinyin": "yā", "mean": "a"},
    {"hanzi": "牙膏", "pinyin": "yá gāo", "mean": "kem đánh răng"},
    {"hanzi": "亚洲", "pinyin": "yà zhōu", "mean": "châu Á"},
    {"hanzi": "严格", "pinyin": "yán gé", "mean": "nghiêm khắc"},
    {"hanzi": "严重", "pinyin": "yán zhòng", "mean": "nghiêm trọng"},
    {"hanzi": "研究", "pinyin": "yán jiū", "mean": "nghiên cứu"},
    {"hanzi": "盐", "pinyin": "yán", "mean": "muối"},
    {"hanzi": "眼镜", "pinyin": "yǎn jìng", "mean": "kính mắt"},
    {"hanzi": "演出", "pinyin": "yǎn chū", "mean": "buổi diễn"},
    {"hanzi": "演员", "pinyin": "yǎn yuán", "mean": "diễn viên"},
    {"hanzi": "阳光", "pinyin": "yáng guāng", "mean": "ánh nắng"},
    {"hanzi": "养成", "pinyin": "yǎng chéng", "mean": "nuôi dưỡng, hình thành"},
    {"hanzi": "样子", "pinyin": "yàng zi", "mean": "kiểu dáng, dáng vẻ"},
    {"hanzi": "邀请", "pinyin": "yāo qǐng", "mean": "mời"},
    {"hanzi": "要是", "pinyin": "yào shì", "mean": "nếu"},
    {"hanzi": "钥匙", "pinyin": "yào shi", "mean": "chìa khóa"},
    {"hanzi": "也许", "pinyin": "yě xǔ", "mean": "có lẽ"},
    {"hanzi": "叶子", "pinyin": "yè zi", "mean": "chiếc lá"},
    {"hanzi": "页", "pinyin": "yè", "mean": "trang mạng"},
    {"hanzi": "一切", "pinyin": "yī qiè", "mean": "tất cả"},
    {"hanzi": "以", "pinyin": "yǐ", "mean": "lấy, với"},
    {"hanzi": "以为", "pinyin": "yǐ wéi", "mean": "tưởng rằng"},
    {"hanzi": "艺术", "pinyin": "yì shù", "mean": "nghệ thuật"},
    {"hanzi": "意见", "pinyin": "yì jiàn", "mean": "ý kiến"},
    {"hanzi": "因此", "pinyin": "yīn cǐ", "mean": "cho nên"},
    {"hanzi": "引起", "pinyin": "yǐn qǐ", "mean": "dẫn đến, gây ra"},
    {"hanzi": "印象", "pinyin": "yìn xiàng", "mean": "ấn tượng"},
    {"hanzi": "赢", "pinyin": "yíng", "mean": "thắng"},
    {"hanzi": "应聘", "pinyin": "yìng pìn", "mean": "ứng tuyển"},
    {"hanzi": "永远", "pinyin": "yǒng yuǎn", "mean": "mãi mãi"},
    {"hanzi": "勇敢", "pinyin": "yǒng gǎn", "mean": "dũng cảm"},
    {"hanzi": "优点", "pinyin": "yōu diǎn", "mean": "ưu điểm"},
    {"hanzi": "优秀", "pinyin": "yōu xiù", "mean": "ưu tú"},
    {"hanzi": "幽默", "pinyin": "yōu mò", "mean": "hài hước"},
    {"hanzi": "尤其", "pinyin": "yóu qí", "mean": "đặc biệt là"},
    {"hanzi": "由", "pinyin": "yóu", "mean": "do"},
    {"hanzi": "由于", "pinyin": "yóu yú", "mean": "do"},
    {"hanzi": "邮局", "pinyin": "yóu jú", "mean": "bưu điện"},
    {"hanzi": "友好", "pinyin": "yǒu hǎo", "mean": "hữu hảo"},
    {"hanzi": "友谊", "pinyin": "yǒu yì", "mean": "hữu nghị"},
    {"hanzi": "有趣", "pinyin": "yǒu qù", "mean": "hứng thú"},
    {"hanzi": "于是", "pinyin": "yú shì", "mean": "thế là"},
    {"hanzi": "愉快", "pinyin": "yú kuài", "mean": "vui vẻ"},
    {"hanzi": "与", "pinyin": "yǔ", "mean": "và"},
    {"hanzi": "羽毛球", "pinyin": "yǔ máo qiú", "mean": "cầu lông"},
    {"hanzi": "语法", "pinyin": "yǔ fǎ", "mean": "ngữ pháp"},
    {"hanzi": "语言", "pinyin": "yǔ yán", "mean": "ngôn ngữ"},
    {"hanzi": "预习", "pinyin": "yù xí", "mean": "chuẩn bị trước"},
    {"hanzi": "原来", "pinyin": "yuán lái", "mean": "hóa ra, vốn, cũ"},
    {"hanzi": "原谅", "pinyin": "yuán liàng", "mean": "tha thứ"},
    {"hanzi": "原因", "pinyin": "yuán yīn", "mean": "nguyên nhân"},
    {"hanzi": "约会", "pinyin": "yuē huì", "mean": "hẹn, cuộc hẹn"},
    {"hanzi": "阅读", "pinyin": "yuè dú", "mean": "đọc hiểu"},
    {"hanzi": "云", "pinyin": "yún", "mean": "mây"},
    {"hanzi": "允许", "pinyin": "yǔn xǔ", "mean": "cho phép"},
    {"hanzi": "杂志", "pinyin": "zá zhì", "mean": "tạp chí"},
    {"hanzi": "咱们", "pinyin": "zán men", "mean": "chúng ta"},
    {"hanzi": "暂时", "pinyin": "zàn shí", "mean": "tạm thời"},
    {"hanzi": "脏", "pinyin": "zāng", "mean": "bẩn"},
    {"hanzi": "责任", "pinyin": "zé rèn", "mean": "trách nhiệm"},
    {"hanzi": "增加", "pinyin": "zēng jiā", "mean": "tăng thêm"},
    {"hanzi": "占线", "pinyin": "zhàn xiàn", "mean": "máy bận"},
    {"hanzi": "招聘", "pinyin": "zhāo pìn", "mean": "tuyển dụng"},
    {"hanzi": "照", "pinyin": "zhào", "mean": "chiếu, chụp"},
    {"hanzi": "真正", "pinyin": "zhēn zhèng", "mean": "thật"},
    {"hanzi": "整理", "pinyin": "zhěng lǐ", "mean": "chỉnh sửa"},
    {"hanzi": "正常", "pinyin": "zhèng cháng", "mean": "bình thường"},
    {"hanzi": "正好", "pinyin": "zhèng hǎo", "mean": "vừa hay"},
    {"hanzi": "正确", "pinyin": "zhèng què", "mean": "chính xác"},
    {"hanzi": "正式", "pinyin": "zhèng shì", "mean": "chính thức"},
    {"hanzi": "证明", "pinyin": "zhèng míng", "mean": "chứng minh"},
    {"hanzi": "之", "pinyin": "zhī", "mean": "của"},
    {"hanzi": "支持", "pinyin": "zhī chí", "mean": "ủng hộ"},
    {"hanzi": "知识", "pinyin": "zhī shí", "mean": "tri thức, kiến thức"},
    {"hanzi": "直接", "pinyin": "zhí jiē", "mean": "trực tiếp"},
    {"hanzi": "值得", "pinyin": "zhí dé", "mean": "đáng"},
    {"hanzi": "职业", "pinyin": "zhí yè", "mean": "nghề nghiệp"},
    {"hanzi": "植物", "pinyin": "zhí wù", "mean": "thực vật"},
    {"hanzi": "只好", "pinyin": "zhǐ hǎo", "mean": "đành"},
    {"hanzi": "只要", "pinyin": "zhǐ yào", "mean": "chỉ cần"},
    {"hanzi": "指", "pinyin": "zhǐ", "mean": "chỉ"},
    {"hanzi": "至少", "pinyin": "zhì shǎo", "mean": "chí ít"},
    {"hanzi": "质量", "pinyin": "zhì liàng", "mean": "chất lượng"},
    {"hanzi": "重", "pinyin": "zhòng", "mean": "nặng"},
    {"hanzi": "重点", "pinyin": "zhòng diǎn", "mean": "trọng điểm"},
    {"hanzi": "重视", "pinyin": "zhòng shì", "mean": "coi trọng"},
    {"hanzi": "周围", "pinyin": "zhōu wéi", "mean": "xung quanh"},
    {"hanzi": "主意", "pinyin": "zhǔ yì", "mean": "chủ ý"},
    {"hanzi": "祝贺", "pinyin": "zhù hè", "mean": "chúc mừng"},
    {"hanzi": "著名", "pinyin": "zhù míng", "mean": "nổi tiếng"},
    {"hanzi": "专门", "pinyin": "zhuān mén", "mean": "chuyên môn"},
    {"hanzi": "专业", "pinyin": "zhuān yè", "mean": "chuyên ngành"},
    {"hanzi": "转", "pinyin": "zhuǎn", "mean": "chuyển"},
    {"hanzi": "赚", "pinyin": "zhuàn", "mean": "kiếm"},
    {"hanzi": "准确", "pinyin": "zhǔn què", "mean": "chính xác"},
    {"hanzi": "准时", "pinyin": "zhǔn shí", "mean": "đúng giờ"},
    {"hanzi": "仔细", "pinyin": "zǐ xì", "mean": "cẩn thận"},
    {"hanzi": "自然", "pinyin": "zì rán", "mean": "tự nhiên"},
    {"hanzi": "自信", "pinyin": "zì xìn", "mean": "tự tin"},
    {"hanzi": "总结", "pinyin": "zǒng jié", "mean": "tổng kết"},
    {"hanzi": "租", "pinyin": "zū", "mean": "thuê"},
    {"hanzi": "最好", "pinyin": "zuì hǎo", "mean": "tốt nhất"},
    {"hanzi": "尊重", "pinyin": "zūn zhòng", "mean": "tôn trọng"},
    {"hanzi": "左右", "pinyin": "zuǒ yòu", "mean": "khoảng"},
    {"hanzi": "作家", "pinyin": "zuò jiā", "mean": "tác gia"},
    {"hanzi": "作用", "pinyin": "zuò yòng", "mean": "tác dụng"},
    {"hanzi": "作者", "pinyin": "zuò zhě", "mean": "tác giả"},
    {"hanzi": "座", "pinyin": "zuò", "mean": "tòa"},
    {"hanzi": "座位", "pinyin": "zuò wèi", "mean": "chỗ ngồi"},
  ];

  /* HSK 5, 6, 7-9 có bộ từ rất lớn (~750 KB) nên được tách ra file riêng và CHỈ TẢI KHI CẦN (khi học viên chọn
     cấp độ đó). Nhờ vậy trang mở nhanh hơn nhiều. HSK 1–4 vẫn nằm sẵn trong file này.
       window.tnDeckReady(level)  → true nếu bộ từ đã sẵn sàng dùng
       window.tnLoadDeck(level)   → Promise<true/false>: tải bộ từ (nếu chưa có) */
  const LAZY_DECKS = { 5: 'tu-vung-hsk5.js?v=1', 6: 'tu-vung-hsk6.js?v=1', 79: 'tu-vung-hsk79.js?v=1' };
  const decks = {
    1: hsk1Deck, 2: hsk2Deck, 3: hsk3Deck, 4: hsk4Deck,
  };
  const deckLoading = {};
  window.tnDeckReady = (level) => !!decks[level];
  window.tnLoadDeck = (level) => {
    if (decks[level]) return Promise.resolve(true);
    if (!LAZY_DECKS[level]) return Promise.resolve(false);
    if (deckLoading[level]) return deckLoading[level];
    deckLoading[level] = new Promise((resolve) => {
      const sc = document.createElement('script');
      sc.src = LAZY_DECKS[level];
      sc.onload = () => { deckLoading[level] = null; resolve(!!decks[level]); };
      sc.onerror = () => { deckLoading[level] = null; sc.remove(); resolve(false); };
      document.head.appendChild(sc);
    });
    return deckLoading[level];
  };
  const levelLabels = { 1: 'hsk 1', 2: 'hsk 2', 3: 'hsk 3', 4: 'hsk 4', 5: 'hsk 5', 6: 'hsk 6', 79: 'hsk 7-9' };
  let currentLevel = 1;

  let fcDeck = hsk1Deck.slice();
  let fcIndex = 0;
  let fcFlipped = false;

  const fcCard = document.getElementById('fc-card');
  const fcFaceFront = document.getElementById('fc-face-front');
  const fcFrontHint = document.getElementById('fc-front-hint');
  const fcHanzi = document.getElementById('fc-hanzi');
  const fcPinyin = document.getElementById('fc-pinyin');
  const fcMean = document.getElementById('fc-mean');
  const fcExample = document.getElementById('fc-example');
  const fcProgress = document.getElementById('fc-progress');
  const fcProgressFill = document.getElementById('fc-progress-fill');
  const fcReviewCountWrap = document.getElementById('fc-review-count');
  const fcReviewCountNum = document.getElementById('fc-review-count-num');
  const fcDeckName = document.getElementById('fc-deck-name');
  const fcImportMsg = document.getElementById('fc-import-msg');
  const fcSpeakFront = document.getElementById('fc-speak-front');
  const fcSpeakBack = document.getElementById('fc-speak-back');
  const fcHskNbCount = document.getElementById('fc-hsk-nb-count');

  // ===== Bảng màu thẻ: 8 màu tươi sáng, mỗi màu có sẵn màu chữ tương phản riêng.
  // Gán màu theo fcIndex % 8 trên 1 thứ tự đã xáo trộn cố định cho mỗi lần nạp bộ từ
  // -> vì chu kỳ dài 8 > 5, bất kỳ 5 thẻ liên tiếp nào cũng chắc chắn không trùng màu. =====
  const FC_PALETTE = [
    { bg: '#6C5CE7', text: '#FFFFFF' }, // tím
    { bg: '#00B894', text: '#FFFFFF' }, // xanh lá đậm
    { bg: '#FDCB3A', text: '#5C3D00' }, // vàng
    { bg: '#FF6B6B', text: '#FFFFFF' }, // đỏ san hô
    { bg: '#0EA5B7', text: '#FFFFFF' }, // xanh ngọc
    { bg: '#FF9F43', text: '#4A2600' }, // cam
    { bg: '#4A90E2', text: '#FFFFFF' }, // xanh dương
    { bg: '#F368A0', text: '#FFFFFF' }, // hồng
  ];
  let fcPaletteOrder = shufflePalette();
  function shufflePalette() {
    const a = FC_PALETTE.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function fcColorFor(index) {
    return fcPaletteOrder[index % fcPaletteOrder.length];
  }

  // ===== Phát âm chữ Hán bằng Web Speech API (speechSynthesis) =====
  // Không cần tải/chuẩn bị file âm thanh nào — trình duyệt tự tổng hợp giọng đọc.
  const fcSpeechSupported = 'speechSynthesis' in window;
  let fcZhVoice = null;

  function fcPickZhVoice() {
    if (!fcSpeechSupported) return;
    const voices = window.speechSynthesis.getVoices();
    // Ưu tiên giọng khớp chính xác zh-CN, sau đó tới bất kỳ giọng tiếng Trung nào có sẵn.
    fcZhVoice =
      voices.find(v => v.lang === 'zh-CN') ||
      voices.find(v => /^zh(-|_)/i.test(v.lang)) ||
      null;
  }
  if (fcSpeechSupported) {
    fcPickZhVoice();
    window.speechSynthesis.addEventListener('voiceschanged', fcPickZhVoice);
  } else {
    [fcSpeakFront, fcSpeakBack].forEach(btn => {
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.35';
        btn.title = 'Trình duyệt này không hỗ trợ phát âm tự động.';
      }
    });
  }

  function fcSpeak(text) {
    if (!fcSpeechSupported || !text) return;
    [fcSpeakFront, fcSpeakBack].forEach(btn => btn && btn.classList.add('is-speaking'));
    const done = () => [fcSpeakFront, fcSpeakBack].forEach(btn => btn && btn.classList.remove('is-speaking'));
    if (window.tnVoice) { window.tnVoice.speak(text, { rate: 0.85, pitch: 1.0 }).finally(done); return; } // giọng đọc dùng chung
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'zh-CN';
    if (fcZhVoice) utter.voice = fcZhVoice;
    utter.rate = 0.85;
    utter.onend = utter.onerror = done;
    window.speechSynthesis.speak(utter);
  }

  function fcUpdateReviewCount() {
    if (!fcReviewCountWrap) return;
    const n = window.getNotebookCount ? window.getNotebookCount() : 0;
    fcReviewCountNum.textContent = String(n);
    fcReviewCountWrap.classList.toggle('hidden', n === 0);
  }

  function fcRender() {
    const word = fcDeck[fcIndex];
    fcCard.classList.remove('is-flipped');
    fcFlipped = false;
    fcHanzi.textContent = word.hanzi;
    fcPinyin.textContent = word.pinyin;
    fcMean.textContent = word.mean && word.mean.trim() ? word.mean : '(chưa có nghĩa)';
    fcMean.classList.toggle('italic', !word.mean || !word.mean.trim());
    fcMean.classList.toggle('text-ink/40', !word.mean || !word.mean.trim());
    fcMean.classList.toggle('text-ink/80', !!(word.mean && word.mean.trim()));
    if (word.example) {
      fcExample.textContent = word.example;
      fcExample.classList.remove('hidden');
    } else {
      fcExample.textContent = '';
      fcExample.classList.add('hidden');
    }

    // Đổ màu mặt trước theo bảng màu, đảm bảo 5 thẻ liên tiếp không trùng màu.
    const color = fcColorFor(fcIndex);
    fcFaceFront.style.background = color.bg;
    fcFaceFront.style.color = color.text;
    fcFrontHint.style.color = color.text;

    fcProgress.textContent = (fcIndex + 1) + ' / ' + fcDeck.length;
    fcProgressFill.style.width = Math.round(((fcIndex + 1) / fcDeck.length) * 100) + '%';
    fcUpdateReviewCount();
  }

  function fcFlip() {
    fcFlipped = !fcFlipped;
    fcCard.classList.toggle('is-flipped', fcFlipped);
    if (fcFlipped && window.trackFlashcardSeen) {
      const word = fcDeck[fcIndex];
      window.trackFlashcardSeen(word.hanzi + '_' + fcIndex);
    }
  }

  function fcNext() {
    fcIndex = (fcIndex + 1) % fcDeck.length;
    fcRender();
    if (window.trackStudyActivity) window.trackStudyActivity();
  }

  function fcPrev() {
    fcIndex = (fcIndex - 1 + fcDeck.length) % fcDeck.length;
    fcRender();
    if (window.trackStudyActivity) window.trackStudyActivity();
  }

  // "Cần ôn lại": ghi từ hiện tại vào sổ tay rồi chuyển sang thẻ tiếp theo.
  function fcMarkReview() {
    const word = fcDeck[fcIndex];
    if (window.addToNotebook) window.addToNotebook(word);
    fcNext();
  }

  // "Đã nhớ": nếu từ này từng nằm trong sổ tay thì gỡ ra (đã thuộc rồi), rồi chuyển tiếp.
  function fcMarkKnown() {
    const word = fcDeck[fcIndex];
    if (window.removeFromNotebook) window.removeFromNotebook(word.hanzi, word.pinyin);
    if (window.trackWordMemorized) window.trackWordMemorized(word, 'flashcard');
    fcNext();
  }

  function fcShuffle() {
    for (let i = fcDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fcDeck[i], fcDeck[j]] = [fcDeck[j], fcDeck[i]];
    }
    fcIndex = 0;
    fcPaletteOrder = shufflePalette();
    fcRender();
  }

  function fcParseImport(raw) {
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsed = [];
    lines.forEach(line => {
      const parts = line.split(/\t|;|,/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        parsed.push({
          hanzi: parts[0] || '',
          pinyin: parts[1] || '',
          mean: parts[2] || '',
        });
      }
    });
    return parsed;
  }

  fcCard.addEventListener('click', fcFlip);
  fcCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fcFlip(); }
  });
  document.getElementById('fc-flip').addEventListener('click', fcFlip);
  document.getElementById('fc-prev').addEventListener('click', fcPrev);
  document.getElementById('fc-review').addEventListener('click', fcMarkReview);
  document.getElementById('fc-known').addEventListener('click', fcMarkKnown);
  document.getElementById('fc-shuffle').addEventListener('click', fcShuffle);

  [fcSpeakFront, fcSpeakBack].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // không cho sự kiện lan lên fc-card (tránh bị lật thẻ khi chỉ muốn nghe)
      fcSpeak(fcDeck[fcIndex].hanzi);
    });
  });

  function fcDeckForLevel(level) {
    if (level === 'notebook') return (window.getNotebookWords ? window.getNotebookWords() : []).slice();
    return (decks[level] || []).slice();
  }
  function fcLabelForLevel(level) {
    return level === 'notebook' ? 'sổ tay từ vựng' : levelLabels[level];
  }

  document.getElementById('fc-load').addEventListener('click', () => {
    const raw = document.getElementById('fc-import').value;
    const newDeck = fcParseImport(raw);
    if (newDeck.length === 0) {
      fcImportMsg.textContent = 'Không đọc được dữ liệu — kiểm tra lại định dạng.';
      fcImportMsg.classList.remove('text-mint');
      fcImportMsg.classList.add('text-seal');
      return;
    }
    fcDeck = newDeck;
    fcIndex = 0;
    fcPaletteOrder = shufflePalette();
    fcDeckName.textContent = fcDeck.length + ' từ (tuỳ chỉnh)';
    fcImportMsg.classList.remove('text-seal');
    fcImportMsg.classList.add('text-mint');
    fcImportMsg.textContent = 'Đã nạp ' + newDeck.length + ' từ.';
    fcRender();
  });

  document.getElementById('fc-reset').addEventListener('click', () => {
    const newDeck = fcDeckForLevel(currentLevel);
    if (newDeck.length === 0) {
      fcImportMsg.classList.remove('text-mint');
      fcImportMsg.classList.add('text-seal');
      fcImportMsg.textContent = 'sổ tay đang trống, chưa có từ nào để ôn.';
      return;
    }
    fcDeck = newDeck;
    fcIndex = 0;
    fcPaletteOrder = shufflePalette();
    fcDeckName.textContent = fcLabelForLevel(currentLevel) + ' · ' + fcDeck.length + ' từ';
    fcImportMsg.textContent = '';
    document.getElementById('fc-import').value = '';
    fcRender();
  });

  // Nạp bộ từ theo cấp độ (được gọi từ bộ chọn "Cấp độ chơi" dùng chung ở đầu trang).
  function fcApplyLevel(level) {
    const newDeck = fcDeckForLevel(level);
    if (newDeck.length === 0) {
      fcImportMsg.classList.remove('text-mint');
      fcImportMsg.classList.add('text-seal');
      fcImportMsg.textContent = 'sổ tay đang trống — chơi vài ván game, từ chọn sai sẽ tự xuất hiện ở đây để ôn.';
      return;
    }
    currentLevel = level;
    fcDeck = newDeck;
    fcIndex = 0;
    fcPaletteOrder = shufflePalette();
    fcDeckName.textContent = fcLabelForLevel(level) + ' · ' + fcDeck.length + ' từ';
    fcImportMsg.textContent = '';
    document.getElementById('fc-import').value = '';
    fcRender();
  }
  window.fcSetLevel = fcApplyLevel;

  if (fcHskNbCount) fcHskNbCount.textContent = String(window.getNotebookCount ? window.getNotebookCount() : 0);
  window.updateFcNotebookBadge = function () {
    if (fcHskNbCount) fcHskNbCount.textContent = String(window.getNotebookCount ? window.getNotebookCount() : 0);
    fcUpdateReviewCount();
  };

  fcRender();
