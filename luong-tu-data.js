/* =====================================================================
   DỮ LIỆU LƯỢNG TỪ cho game "Pikachu lượng từ 连连看" (game-pikachu.js)
   ---------------------------------------------------------------------
   Nguồn: bảng "200 lượng từ tiếng Trung" (chữ Hán – pinyin – nghĩa – ví dụ).
   Chỉ giữ các lượng từ đi với DANH TỪ (bỏ động lượng từ 次/遍/趟/下…, đơn vị thời gian
   秒/天/年…, đơn vị đo 斤/两/克/毫升 và mục 泄).

   CLASSIFIERS: lượng từ → [pinyin, nghĩa ngắn, cấp HSK]
   NOUNS: 'chữ Hán|pinyin|nghĩa|các lượng từ dùng được|cấp HSK' — một danh từ có thể đi với
   nhiều lượng từ; game coi MỌI lượng từ trong danh sách là đáp án đúng.

   CẤP HSK lấy theo danh sách từ vựng HSK 1–9 của web (tu-vung.js): 1–6 = HSK1–6,
   7 = HSK7-9, 0 = không có trong danh sách. Lượng từ chỉ có dạng "X子" trong danh sách
   thì lấy cấp của từ đó (杯 ← 杯子 HSK1, 盘 ← 盘子 HSK3, 句 ← 句子, 盒 ← 盒子).
   Game chia 3 trình độ:  sơ cấp = cấp 1–3 · trung cấp = cấp 1–5 · cao cấp = tất cả.
   ===================================================================== */

export const CLASSIFIERS = {
  个: ['gè', 'cái, người (chung)', 1],
  位: ['wèi', 'vị (lịch sự)', 3],
  名: ['míng', 'người (văn viết)', 0],
  口: ['kǒu', 'nhân khẩu; cái (giếng, nồi)', 3],
  只: ['zhī', 'con; chiếc (một bên của cặp)', 3],
  条: ['tiáo', 'con, sợi, chiếc (vật dài); tin, điều', 3],
  匹: ['pǐ', 'con (ngựa)', 5],
  头: ['tóu', 'con (gia súc lớn)', 0],
  峰: ['fēng', 'con (lạc đà)', 0],
  群: ['qún', 'đàn, nhóm', 5],
  窝: ['wō', 'ổ, lứa (động vật)', 6],
  双: ['shuāng', 'đôi', 3],
  对: ['duì', 'đôi, cặp', 2],
  胎: ['tāi', 'lứa (con non)', 7],
  件: ['jiàn', 'chiếc, món, việc', 2],
  张: ['zhāng', 'tờ, tấm, chiếc (vật phẳng)', 2],
  本: ['běn', 'quyển', 1],
  册: ['cè', 'cuốn, tập', 5],
  支: ['zhī', 'cây (bút); bài (hát)', 5],
  枝: ['zhī', 'cành', 6],
  根: ['gēn', 'sợi, cây, que', 5],
  把: ['bǎ', 'cái (có tay cầm); nắm', 3],
  套: ['tào', 'bộ; căn (nhà)', 5],
  部: ['bù', 'bộ (phim, sách, máy)', 0],
  台: ['tái', 'chiếc (máy móc); buổi (diễn)', 4],
  架: ['jià', 'chiếc (máy bay)', 7],
  辆: ['liàng', 'chiếc (xe)', 3],
  艘: ['sōu', 'chiếc (tàu thuyền)', 6],
  盏: ['zhǎn', 'ngọn (đèn)', 7],
  面: ['miàn', 'tấm, chiếc (gương, cờ, trống)', 6],
  扇: ['shàn', 'cánh (cửa)', 5],
  堵: ['dǔ', 'bức (tường)', 0],
  道: ['dào', 'vệt, luồng; món (ăn); câu (hỏi)', 0],
  片: ['piàn', 'miếng, lát; mảng, vùng', 5],
  块: ['kuài', 'miếng, cục, khối; đồng (tiền)', 1],
  粒: ['lì', 'hạt', 0],
  颗: ['kē', 'hạt, viên, ngôi', 5],
  滴: ['dī', 'giọt', 5],
  滩: ['tān', 'vũng, bãi', 0],
  包: ['bāo', 'gói', 3],
  袋: ['dài', 'túi, bao', 0],
  盒: ['hé', 'hộp', 4],
  箱: ['xiāng', 'thùng, hòm', 0],
  瓶: ['píng', 'chai, lọ', 0],
  罐: ['guàn', 'lon, hũ', 6],
  杯: ['bēi', 'cốc, ly', 1],
  碗: ['wǎn', 'bát', 3],
  盘: ['pán', 'đĩa; ván (cờ)', 3],
  碟: ['dié', 'đĩa nhỏ', 7],
  盆: ['pén', 'chậu', 5],
  桶: ['tǒng', 'xô, thùng', 0],
  勺: ['sháo', 'thìa', 4],
  壶: ['hú', 'ấm, bình', 5],
  所: ['suǒ', 'ngôi (trường, viện)', 5],
  家: ['jiā', '(cửa hàng, công ty)', 1],
  间: ['jiān', 'gian, phòng', 0],
  栋: ['dòng', 'toà (nhà)', 6],
  座: ['zuò', 'toà, ngọn, cây (cầu)', 4],
  幢: ['zhuàng', 'toà (nhà)', 6],
  层: ['céng', 'tầng, lớp', 3],
  处: ['chù', 'nơi, chỗ', 0],
  堂: ['táng', 'tiết (học)', 7],
  篇: ['piān', 'bài (văn)', 4],
  节: ['jié', 'tiết (học)', 4],
  段: ['duàn', 'đoạn', 3],
  句: ['jù', 'câu', 3],
  行: ['háng', 'dòng', 4],
  页: ['yè', 'trang', 4],
  封: ['fēng', 'bức (thư)', 0],
  则: ['zé', 'mẩu (tin, chuyện)', 5],
  首: ['shǒu', 'bài (thơ, hát)', 5],
  曲: ['qǔ', 'khúc (nhạc)', 6],
  集: ['jí', 'tập (phim)', 0],
  场: ['chǎng', 'trận, buổi, cuộc', 4],
  幅: ['fú', 'bức (tranh)', 5],
  帧: ['zhēn', 'khung (hình)', 0],
  份: ['fèn', 'phần, suất, bản', 4],
  项: ['xiàng', 'hạng mục', 5],
  期: ['qī', 'kỳ, số (báo)', 0],
  届: ['jiè', 'khoá, kỳ', 5],
  顿: ['dùn', 'bữa', 5],
  阵: ['zhèn', 'cơn, trận', 5],
  通: ['tōng', 'cuộc (điện thoại)', 0],
  笔: ['bǐ', 'khoản (tiền)', 0],
  桩: ['zhuāng', 'vụ, việc', 7],
  宗: ['zōng', 'vụ, lô', 7],
  起: ['qǐ', 'vụ (tai nạn, án)', 0],
  例: ['lì', 'ca, trường hợp', 0],
  轮: ['lún', 'vòng; vầng (trăng)', 0],
  局: ['jú', 'ván', 0],
  客: ['kè', 'suất (nhà hàng)', 0],
  股: ['gǔ', 'luồng, dòng', 7],
  缕: ['lǚ', 'làn, sợi', 7],
  丝: ['sī', 'sợi, chút', 7],
  弯: ['wān', 'vầng (trăng khuyết)', 0],
  泓: ['hóng', '(dòng nước trong)', 0],
  顶: ['dǐng', 'chiếc (mũ)', 5],
  枚: ['méi', 'chiếc, đồng (vật nhỏ)', 6],
  串: ['chuàn', 'chuỗi, chùm', 6],
  挂: ['guà', 'tràng, dây (treo)', 4],
  捆: ['kǔn', 'bó', 7],
  束: ['shù', 'bó', 6],
  扎: ['zā', 'bó', 6],
  组: ['zǔ', 'nhóm, bộ', 5],
  副: ['fù', 'bộ, cặp', 6],
};

export const NOUNS = `
人|rén|người|个 群 口|1
老师|lǎoshī|giáo viên|个 位 名 群|1
学生|xuésheng|học sinh|个 位 名 群 届|1
客人|kèrén|khách|个 位 群|3
医生|yīshēng|bác sĩ|个 位 名|1
朋友|péngyou|bạn bè|个 位 群|1
孩子|háizi|trẻ con|个 群|2
猫|māo|con mèo|只 群 窝|1
小猫|xiǎomāo|mèo con|只 群 窝 胎|0
狗|gǒu|con chó|只 条 群 窝|1
小狗|xiǎogǒu|chó con|只 条 群 窝 胎|0
鸟|niǎo|con chim|只 群|3
小鸡|xiǎojī|gà con|只 群 窝|0
鱼|yú|con cá|条 群 盘|2
蛇|shé|con rắn|条|5
马|mǎ|con ngựa|匹 群|3
牛|niú|con bò|头 群|0
猪|zhū|con lợn|头 口 群 窝|5
羊|yáng|con dê, cừu|只 头 群|0
骆驼|luòtuo|lạc đà|峰 头 匹 群|0
大象|dàxiàng|con voi|头 只 群|5
蜜蜂|mìfēng|con ong|只 群|5
蚂蚁|mǎyǐ|con kiến|只 群|0
眼睛|yǎnjing|mắt|双 对 只|2
耳朵|ěrduo|tai|只 对 双|3
手|shǒu|tay|只 双|0
翅膀|chìbǎng|cánh (chim)|对 双 只|5
情侣|qínglǚ|cặp tình nhân|对|7
夫妻|fūqī|vợ chồng|对|0
衣服|yīfu|quần áo|件 套|1
裤子|kùzi|quần|条|3
裙子|qúnzi|váy|条|3
鞋|xié|giày|双 只|3
袜子|wàzi|tất|双 只|4
手套|shǒutào|găng tay|双 只 副|5
帽子|màozi|mũ|顶 个|3
围巾|wéijīn|khăn quàng|条|5
领带|lǐngdài|cà vạt|条|0
毛巾|máojīn|khăn mặt|条|4
眼镜|yǎnjìng|kính mắt|副|3
戒指|jièzhi|nhẫn|枚 个|5
奖牌|jiǎngpái|huy chương|枚 块|0
邮票|yóupiào|tem|枚 张 套|0
硬币|yìngbì|đồng xu|枚 个|7
手表|shǒubiǎo|đồng hồ đeo tay|块 只 个|2
纸|zhǐ|giấy|张 页|0
照片|zhàopiàn|ảnh|张 组|3
桌子|zhuōzi|cái bàn|张 个|1
床|chuáng|cái giường|张|0
脸|liǎn|khuôn mặt|张|3
地图|dìtú|bản đồ|张 幅|3
票|piào|vé|张|2
书|shū|sách|本 册 套 箱 捆 页|1
词典|cídiǎn|từ điển|本 部 册|0
杂志|zázhì|tạp chí|本 期 份|4
日记|rìjì|nhật ký|篇 本|4
笔|bǐ|bút|支 枝|0
铅笔|qiānbǐ|bút chì|支 枝 根|3
花|huā|hoa|枝 束 盆 扎|3
鲜花|xiānhuā|hoa tươi|束 扎 枝|0
绳子|shéngzi|dây thừng|根 条 段|5
头发|tóufa|tóc|根 缕 头|3
筷子|kuàizi|đũa|双 根 副|3
椅子|yǐzi|cái ghế|把 张 个|1
伞|sǎn|cái ô|把|3
刀|dāo|con dao|把|4
钥匙|yàoshi|chìa khoá|把 串|4
工具|gōngjù|dụng cụ|套 件 把|5
行李|xíngli|hành lý|件 个|0
礼物|lǐwù|quà|份 个 件|3
电影|diànyǐng|phim điện ảnh|部 场|1
电视剧|diànshìjù|phim truyền hình|部 集|0
手机|shǒujī|điện thoại di động|部 台 个|2
电脑|diànnǎo|máy tính|台 部|1
电视|diànshì|tivi|台|1
冰箱|bīngxiāng|tủ lạnh|台|3
飞机|fēijī|máy bay|架|1
汽车|qìchē|ô tô|辆 部|0
自行车|zìxíngchē|xe đạp|辆|2
船|chuán|thuyền|艘 条 只|2
灯|dēng|đèn|盏 个|3
锅|guō|cái nồi|口 个|5
井|jǐng|giếng|口|6
镜子|jìngzi|gương|面 个|4
旗子|qízi|lá cờ|面|0
鼓|gǔ|cái trống|面|0
门|mén|cửa|扇 道 个|2
窗户|chuānghu|cửa sổ|扇 个|4
墙|qiáng|bức tường|堵 面 道|5
面包|miànbāo|bánh mì|片 块 个|3
蛋糕|dàngāo|bánh ngọt|块 个 盒 层|3
饼干|bǐnggān|bánh quy|包 块 盒 袋|4
糖|táng|kẹo, đường|颗 块 粒 包 袋 勺 盒|3
巧克力|qiǎokèlì|sô-cô-la|块 盒 颗 包|4
水|shuǐ|nước|滴 杯 瓶 桶 壶 碗 盆 滩|1
牛奶|niúnǎi|sữa|杯 瓶 盒 箱 袋 罐|2
可乐|kělè|cô-ca|罐 瓶 杯 箱|0
茶|chá|trà|杯 壶 碗 包|1
咖啡|kāfēi|cà phê|杯 壶 罐|2
啤酒|píjiǔ|bia|瓶 杯 罐 箱 桶 扎|3
酒|jiǔ|rượu|杯 瓶 壶|0
油|yóu|dầu ăn|桶 瓶 滴 勺|0
苹果|píngguǒ|quả táo|个 箱 袋 盘|1
葡萄|pútao|nho|颗 粒 串 盘|3
香蕉|xiāngjiāo|chuối|根 串 个|3
花生|huāshēng|lạc|粒 颗 碟 包 袋 把 盘|5
米|mǐ|gạo|粒 把 袋 碗 包|3
米饭|mǐfàn|cơm|碗 粒|1
饭|fàn|bữa cơm|顿 碗 口|0
面条|miàntiáo|mì sợi|碗 根 盘 包|3
饺子|jiǎozi|sủi cảo|盘 碗 个 只|4
菜|cài|món ăn|盘 道 碟 碗|1
汤|tāng|canh|碗 勺 份|4
炒饭|chǎofàn|cơm rang|份 盘 碗 客|0
牛排|niúpái|bít tết|客 份 块|0
肉|ròu|thịt|块 片|0
酱油|jiàngyóu|xì dầu|碟 瓶 勺 滴|5
蜂蜜|fēngmì|mật ong|罐 瓶 勺 滴|7
盐|yán|muối|勺 包 袋|4
药|yào|thuốc|粒 片 颗 包 瓶|2
珍珠|zhēnzhū|ngọc trai|颗 粒 串|6
学校|xuéxiào|trường học|所 个|1
医院|yīyuàn|bệnh viện|所 家 个 座|1
公司|gōngsī|công ty|家 个|2
商店|shāngdiàn|cửa hàng|家 个 间|1
饭馆|fànguǎn|quán ăn|家 个 间|1
房间|fángjiān|căn phòng|间 个|2
办公室|bàngōngshì|văn phòng|间 个|3
房子|fángzi|ngôi nhà|套 栋 座 间 所 幢 处 个|0
大楼|dàlóu|toà nhà lớn|栋 座 幢|0
楼|lóu|toà nhà, lầu|栋 座 幢 层|3
山|shān|ngọn núi|座|0
桥|qiáo|cây cầu|座|4
街|jiē|con phố|条|0
路|lù|con đường|条 段|2
河|hé|dòng sông|条|3
地方|dìfang|nơi, chỗ|个 处|3
景点|jǐngdiǎn|điểm tham quan|个 处|0
名胜|míngshèng|danh lam thắng cảnh|处|0
空地|kòngdì|bãi đất trống|块 片|0
堤坝|dībà|con đê|道 条 座|6
森林|sēnlín|khu rừng|片|4
树叶|shùyè|lá cây|片|0
课|kè|bài học, tiết học|节 堂|2
文章|wénzhāng|bài văn|篇|4
小说|xiǎoshuō|tiểu thuyết|部 本 篇|4
信|xìn|bức thư|封|3
话|huà|lời nói|句 段|0
字|zì|chữ|个 行|1
诗|shī|bài thơ|首 行|5
歌|gē|bài hát|首 支 曲|0
民歌|míngē|dân ca|首 曲 支|0
画|huà|bức tranh|幅 张|3
画面|huàmiàn|khung hình|帧 幅 个|0
报告|bàogào|bản báo cáo|份 篇 个|5
报纸|bàozhǐ|tờ báo|份 张|2
研究|yánjiū|công trình nghiên cứu|项 个|4
任务|rènwu|nhiệm vụ|项 个|4
工作|gōngzuò|công việc|份 项 个|1
寓言|yùyán|truyện ngụ ngôn|则 个 篇|6
故事|gùshi|câu chuyện|个 则 段|3
新闻|xīnwén|tin tức|条 则|3
消息|xiāoxi|tin nhắn, tin tức|条 个 则|4
规定|guīdìng|quy định|条 项|4
节目|jiémù|chương trình|个 期 台|3
数据|shùjù|dữ liệu|组 项|5
题|tí|câu hỏi, bài tập|道 个|2
时间|shíjiān|thời gian|段|2
事情|shìqing|sự việc|件 桩 个|2
比赛|bǐsài|cuộc thi đấu|场 轮 局 个|3
奥运会|àoyùnhuì|Thế vận hội|届|0
考试|kǎoshì|kỳ thi|场|2
演出|yǎnchū|buổi biểu diễn|场 台|4
电话|diànhuà|cuộc gọi, điện thoại|通 个 部|0
钱|qián|tiền|笔 块|1
生意|shēngyi|việc làm ăn|笔 桩 宗|4
案件|ànjiàn|vụ án|起 宗 桩 个|6
事故|shìgù|tai nạn|起 场|6
病例|bìnglì|ca bệnh|例 个|0
棋|qí|cờ|盘 局 副|0
扑克|pūkè|bộ bài tây|副|7
风|fēng|gió|阵 股 缕|0
雨|yǔ|mưa|场 阵 滴|0
雪|xuě|tuyết|场|2
掌声|zhǎngshēng|tràng vỗ tay|阵|0
闪电|shǎndiàn|tia chớp|道|5
彩虹|cǎihóng|cầu vồng|道|5
星星|xīngxing|ngôi sao|颗|0
心|xīn|trái tim|颗|0
眼泪|yǎnlèi|nước mắt|滴|0
月亮|yuèliang|mặt trăng|轮 弯 个|3
太阳|tàiyáng|mặt trời|轮 个|3
明月|míngyuè|trăng sáng|轮|0
新月|xīnyuè|trăng non|弯|0
阳光|yángguāng|ánh nắng|缕 束 道 丝 片|4
烟|yān|khói|缕 股 丝|0
凉意|liángyì|hơi mát lạnh|丝 股|0
暖流|nuǎnliú|dòng ấm áp|股|0
香味|xiāngwèi|mùi thơm|股 丝 阵|0
清泉|qīngquán|suối trong|泓 股|0
湖水|húshuǐ|nước hồ|泓 片|0
泥|ní|bùn|滩 块|0
柴|chái|củi|捆 根 把|0
鞭炮|biānpào|tràng pháo|挂 串|5
名字|míngzi|tên|个|1
问题|wèntí|câu hỏi, vấn đề|个 道|2
同学|tóngxué|bạn học|个 位 名 群|1
男人|nánrén|đàn ông|个 群|2
女人|nǚrén|phụ nữ|个 群|2
熊猫|xióngmāo|gấu trúc|只 群|3
草|cǎo|cỏ|片 根|3
出租车|chūzūchē|taxi|辆 部|1
公共汽车|gōnggòng qìchē|xe buýt|辆 部|2
菜单|càidān|thực đơn|份 张 个|3
宾馆|bīnguǎn|khách sạn|家 个 座|3
银行|yínháng|ngân hàng|家 个|3
超市|chāoshì|siêu thị|家 个|3
机场|jīchǎng|sân bay|个 座|2
教室|jiàoshì|phòng học|间 个|2
电梯|diàntī|thang máy|部 台 个|3
空调|kōngtiáo|điều hoà|台 个|3
照相机|zhàoxiàngjī|máy ảnh|台 部 个|3
黑板|hēibǎn|bảng đen|块 个|3
作业|zuòyè|bài tập về nhà|份 道|3
衬衫|chènshān|áo sơ mi|件|3
西瓜|xīguā|dưa hấu|个 块 片|2
鸡蛋|jīdàn|trứng gà|个 盒|2
羊肉|yángròu|thịt cừu|块 片|2
水果|shuǐguǒ|hoa quả|盘 箱 袋 份|1
包|bāo|cái túi|个 只|3
行李箱|xínglixiāng|va-li|个 只|3
护照|hùzhào|hộ chiếu|本|3
字典|zìdiǎn|từ điển (chữ)|本 部|3
果汁|guǒzhī|nước ép|杯 瓶 盒 罐|3
城市|chéngshì|thành phố|座 个|3
国家|guójiā|quốc gia|个|3
公园|gōngyuán|công viên|个 座|3
街道|jiēdào|đường phố|条|3
节日|jiérì|ngày lễ|个|3
办法|bànfǎ|cách, biện pháp|个|3
词语|cíyǔ|từ ngữ|个 组|3
花园|huāyuán|vườn hoa|个 座|3
声音|shēngyīn|âm thanh|个 阵|3
腿|tuǐ|chân (cẳng chân)|条 双 只|3
脚|jiǎo|bàn chân|只 双|3
杯子|bēizi|cái cốc|个 只|1
盘子|pánzi|cái đĩa|个 只|3
汉语|Hànyǔ|tiếng Hán|句|1
`.trim().split('\n').map(line => {
  const [h, p, v, cl, hsk] = line.split('|');
  return { h, p, v, cl: cl.trim().split(/\s+/), hsk: +hsk || 0 };
});
