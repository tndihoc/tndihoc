/* =====================================================================
   DỮ LIỆU LƯỢNG TỪ cho game "Pikachu lượng từ 连连看" (game-pikachu.js)
   ---------------------------------------------------------------------
   Nguồn: bảng "200 lượng từ tiếng Trung" (chữ Hán – pinyin – nghĩa – ví dụ).
   Chỉ giữ các lượng từ đi với DANH TỪ (bỏ động lượng từ 次/遍/趟/下…, đơn vị thời gian
   秒/天/年…, đơn vị đo 斤/两/克/毫升 và mục 泄).

   CLASSIFIERS: lượng từ → [pinyin, nghĩa ngắn, bậc khó 1-3]
   NOUNS: 'chữ Hán|pinyin|nghĩa|các lượng từ dùng được' — một danh từ có thể đi với
   nhiều lượng từ; game coi MỌI lượng từ trong danh sách là đáp án đúng.
   ===================================================================== */

export const CLASSIFIERS = {
  个: ['gè', 'cái, người (chung)', 1],
  位: ['wèi', 'vị (lịch sự)', 1],
  名: ['míng', 'người (văn viết)', 2],
  口: ['kǒu', 'nhân khẩu; cái (giếng, nồi)', 1],
  只: ['zhī', 'con; chiếc (một bên của cặp)', 1],
  条: ['tiáo', 'con, sợi, chiếc (vật dài); tin, điều', 1],
  匹: ['pǐ', 'con (ngựa)', 2],
  头: ['tóu', 'con (gia súc lớn)', 1],
  峰: ['fēng', 'con (lạc đà)', 3],
  群: ['qún', 'đàn, nhóm', 1],
  窝: ['wō', 'ổ, lứa (động vật)', 3],
  双: ['shuāng', 'đôi', 1],
  对: ['duì', 'đôi, cặp', 2],
  胎: ['tāi', 'lứa (con non)', 3],
  件: ['jiàn', 'chiếc, món, việc', 1],
  张: ['zhāng', 'tờ, tấm, chiếc (vật phẳng)', 1],
  本: ['běn', 'quyển', 1],
  册: ['cè', 'cuốn, tập', 3],
  支: ['zhī', 'cây (bút); bài (hát)', 1],
  枝: ['zhī', 'cành', 2],
  根: ['gēn', 'sợi, cây, que', 2],
  把: ['bǎ', 'cái (có tay cầm); nắm', 1],
  套: ['tào', 'bộ; căn (nhà)', 2],
  部: ['bù', 'bộ (phim, sách, máy)', 2],
  台: ['tái', 'chiếc (máy móc); buổi (diễn)', 1],
  架: ['jià', 'chiếc (máy bay)', 2],
  辆: ['liàng', 'chiếc (xe)', 1],
  艘: ['sōu', 'chiếc (tàu thuyền)', 2],
  盏: ['zhǎn', 'ngọn (đèn)', 2],
  面: ['miàn', 'tấm, chiếc (gương, cờ, trống)', 2],
  扇: ['shàn', 'cánh (cửa)', 2],
  堵: ['dǔ', 'bức (tường)', 2],
  道: ['dào', 'vệt, luồng; món (ăn); câu (hỏi)', 2],
  片: ['piàn', 'miếng, lát; mảng, vùng', 1],
  块: ['kuài', 'miếng, cục, khối; đồng (tiền)', 1],
  粒: ['lì', 'hạt', 2],
  颗: ['kē', 'hạt, viên, ngôi', 2],
  滴: ['dī', 'giọt', 2],
  滩: ['tān', 'vũng, bãi', 3],
  包: ['bāo', 'gói', 2],
  袋: ['dài', 'túi, bao', 2],
  盒: ['hé', 'hộp', 2],
  箱: ['xiāng', 'thùng, hòm', 2],
  瓶: ['píng', 'chai, lọ', 1],
  罐: ['guàn', 'lon, hũ', 2],
  杯: ['bēi', 'cốc, ly', 1],
  碗: ['wǎn', 'bát', 1],
  盘: ['pán', 'đĩa; ván (cờ)', 1],
  碟: ['dié', 'đĩa nhỏ', 2],
  盆: ['pén', 'chậu', 2],
  桶: ['tǒng', 'xô, thùng', 2],
  勺: ['sháo', 'thìa', 3],
  壶: ['hú', 'ấm, bình', 2],
  所: ['suǒ', 'ngôi (trường, viện)', 1],
  家: ['jiā', '(cửa hàng, công ty)', 1],
  间: ['jiān', 'gian, phòng', 2],
  栋: ['dòng', 'toà (nhà)', 2],
  座: ['zuò', 'toà, ngọn, cây (cầu)', 1],
  幢: ['zhuàng', 'toà (nhà)', 3],
  层: ['céng', 'tầng, lớp', 2],
  处: ['chù', 'nơi, chỗ', 3],
  堂: ['táng', 'tiết (học)', 3],
  篇: ['piān', 'bài (văn)', 2],
  节: ['jié', 'tiết (học)', 1],
  段: ['duàn', 'đoạn', 2],
  句: ['jù', 'câu', 1],
  行: ['háng', 'dòng', 3],
  页: ['yè', 'trang', 2],
  封: ['fēng', 'bức (thư)', 1],
  则: ['zé', 'mẩu (tin, chuyện)', 3],
  首: ['shǒu', 'bài (thơ, hát)', 1],
  曲: ['qǔ', 'khúc (nhạc)', 3],
  集: ['jí', 'tập (phim)', 3],
  场: ['chǎng', 'trận, buổi, cuộc', 1],
  幅: ['fú', 'bức (tranh)', 2],
  帧: ['zhēn', 'khung (hình)', 3],
  份: ['fèn', 'phần, suất, bản', 1],
  项: ['xiàng', 'hạng mục', 2],
  期: ['qī', 'kỳ, số (báo)', 3],
  届: ['jiè', 'khoá, kỳ', 3],
  顿: ['dùn', 'bữa', 1],
  阵: ['zhèn', 'cơn, trận', 3],
  通: ['tōng', 'cuộc (điện thoại)', 3],
  笔: ['bǐ', 'khoản (tiền)', 3],
  桩: ['zhuāng', 'vụ, việc', 3],
  宗: ['zōng', 'vụ, lô', 3],
  起: ['qǐ', 'vụ (tai nạn, án)', 3],
  例: ['lì', 'ca, trường hợp', 3],
  轮: ['lún', 'vòng; vầng (trăng)', 3],
  局: ['jú', 'ván', 3],
  客: ['kè', 'suất (nhà hàng)', 3],
  股: ['gǔ', 'luồng, dòng', 3],
  缕: ['lǚ', 'làn, sợi', 3],
  丝: ['sī', 'sợi, chút', 3],
  弯: ['wān', 'vầng (trăng khuyết)', 3],
  泓: ['hóng', '(dòng nước trong)', 3],
  顶: ['dǐng', 'chiếc (mũ)', 1],
  枚: ['méi', 'chiếc, đồng (vật nhỏ)', 3],
  串: ['chuàn', 'chuỗi, chùm', 2],
  挂: ['guà', 'tràng, dây (treo)', 3],
  捆: ['kǔn', 'bó', 3],
  束: ['shù', 'bó', 2],
  扎: ['zā', 'bó', 3],
  组: ['zǔ', 'nhóm, bộ', 3],
  副: ['fù', 'bộ, cặp', 2],
};

export const NOUNS = `
人|rén|người|个 群 口
老师|lǎoshī|giáo viên|个 位 名 群
学生|xuésheng|học sinh|个 位 名 群 届
客人|kèrén|khách|个 位 群
医生|yīshēng|bác sĩ|个 位 名
朋友|péngyou|bạn bè|个 位 群
孩子|háizi|trẻ con|个 群
猫|māo|con mèo|只 群 窝
小猫|xiǎomāo|mèo con|只 群 窝 胎
狗|gǒu|con chó|只 条 群 窝
小狗|xiǎogǒu|chó con|只 条 群 窝 胎
鸟|niǎo|con chim|只 群
小鸡|xiǎojī|gà con|只 群 窝
鱼|yú|con cá|条 群 盘
蛇|shé|con rắn|条
马|mǎ|con ngựa|匹 群
牛|niú|con bò|头 群
猪|zhū|con lợn|头 口 群 窝
羊|yáng|con dê, cừu|只 头 群
骆驼|luòtuo|lạc đà|峰 头 匹 群
大象|dàxiàng|con voi|头 只 群
蜜蜂|mìfēng|con ong|只 群
蚂蚁|mǎyǐ|con kiến|只 群
眼睛|yǎnjing|mắt|双 对 只
耳朵|ěrduo|tai|只 对 双
手|shǒu|tay|只 双
翅膀|chìbǎng|cánh (chim)|对 双 只
情侣|qínglǚ|cặp tình nhân|对
夫妻|fūqī|vợ chồng|对
衣服|yīfu|quần áo|件 套
裤子|kùzi|quần|条
裙子|qúnzi|váy|条
鞋|xié|giày|双 只
袜子|wàzi|tất|双 只
手套|shǒutào|găng tay|双 只 副
帽子|màozi|mũ|顶 个
围巾|wéijīn|khăn quàng|条
领带|lǐngdài|cà vạt|条
毛巾|máojīn|khăn mặt|条
眼镜|yǎnjìng|kính mắt|副
戒指|jièzhi|nhẫn|枚 个
奖牌|jiǎngpái|huy chương|枚 块
邮票|yóupiào|tem|枚 张 套
硬币|yìngbì|đồng xu|枚 个
手表|shǒubiǎo|đồng hồ đeo tay|块 只 个
纸|zhǐ|giấy|张 页
照片|zhàopiàn|ảnh|张 组
桌子|zhuōzi|cái bàn|张 个
床|chuáng|cái giường|张
脸|liǎn|khuôn mặt|张
地图|dìtú|bản đồ|张 幅
票|piào|vé|张
书|shū|sách|本 册 套 箱 捆
词典|cídiǎn|từ điển|本 部 册
杂志|zázhì|tạp chí|本 期 份
日记|rìjì|nhật ký|篇 本
笔|bǐ|bút|支 枝
铅笔|qiānbǐ|bút chì|支 枝 根
花|huā|hoa|枝 束 盆 扎
鲜花|xiānhuā|hoa tươi|束 扎 枝
绳子|shéngzi|dây thừng|根 条 段
头发|tóufa|tóc|根 缕 头
筷子|kuàizi|đũa|双 根 副
椅子|yǐzi|cái ghế|把 张 个
伞|sǎn|cái ô|把
刀|dāo|con dao|把
钥匙|yàoshi|chìa khoá|把 串
工具|gōngjù|dụng cụ|套 件 把
行李|xíngli|hành lý|件 个
礼物|lǐwù|quà|份 个 件
电影|diànyǐng|phim điện ảnh|部 场
电视剧|diànshìjù|phim truyền hình|部 集
手机|shǒujī|điện thoại di động|部 台 个
电脑|diànnǎo|máy tính|台 部
电视|diànshì|tivi|台
冰箱|bīngxiāng|tủ lạnh|台
飞机|fēijī|máy bay|架
汽车|qìchē|ô tô|辆 部
自行车|zìxíngchē|xe đạp|辆
船|chuán|thuyền|艘 条 只
灯|dēng|đèn|盏 个
锅|guō|cái nồi|口 个
井|jǐng|giếng|口
镜子|jìngzi|gương|面 个
旗子|qízi|lá cờ|面
鼓|gǔ|cái trống|面
门|mén|cửa|扇 道 个
窗户|chuānghu|cửa sổ|扇 个
墙|qiáng|bức tường|堵 面 道
面包|miànbāo|bánh mì|片 块 个
蛋糕|dàngāo|bánh ngọt|块 个 盒 层
饼干|bǐnggān|bánh quy|包 块 盒 袋
糖|táng|kẹo, đường|颗 块 粒 包 袋 勺 盒
巧克力|qiǎokèlì|sô-cô-la|块 盒 颗 包
水|shuǐ|nước|滴 杯 瓶 桶 壶 碗 盆 滩
牛奶|niúnǎi|sữa|杯 瓶 盒 箱 袋 罐
可乐|kělè|cô-ca|罐 瓶 杯 箱
茶|chá|trà|杯 壶 碗 包
咖啡|kāfēi|cà phê|杯 壶 罐
啤酒|píjiǔ|bia|瓶 杯 罐 箱 桶 扎
酒|jiǔ|rượu|杯 瓶 壶
油|yóu|dầu ăn|桶 瓶 滴 勺
苹果|píngguǒ|quả táo|个 箱 袋 盘
葡萄|pútao|nho|颗 粒 串 盘
香蕉|xiāngjiāo|chuối|根 串 个
花生|huāshēng|lạc|粒 颗 碟 包 袋 把 盘
米|mǐ|gạo|粒 把 袋 碗 包
米饭|mǐfàn|cơm|碗 粒
饭|fàn|bữa cơm|顿 碗 口
面条|miàntiáo|mì sợi|碗 根 盘 包
饺子|jiǎozi|sủi cảo|盘 碗 个 只
菜|cài|món ăn|盘 道 碟 碗
汤|tāng|canh|碗 勺 份
炒饭|chǎofàn|cơm rang|份 盘 碗 客
牛排|niúpái|bít tết|客 份 块
肉|ròu|thịt|块 片
酱油|jiàngyóu|xì dầu|碟 瓶 勺 滴
蜂蜜|fēngmì|mật ong|罐 瓶 勺 滴
盐|yán|muối|勺 包 袋
药|yào|thuốc|粒 片 颗 包 瓶
珍珠|zhēnzhū|ngọc trai|颗 粒 串
学校|xuéxiào|trường học|所 个
医院|yīyuàn|bệnh viện|所 家 个 座
公司|gōngsī|công ty|家 个
商店|shāngdiàn|cửa hàng|家 个 间
饭馆|fànguǎn|quán ăn|家 个 间
房间|fángjiān|căn phòng|间 个
办公室|bàngōngshì|văn phòng|间 个
房子|fángzi|ngôi nhà|套 栋 座 间 所 幢 处 个
大楼|dàlóu|toà nhà lớn|栋 座 幢
楼|lóu|toà nhà, lầu|栋 座 幢 层
山|shān|ngọn núi|座
桥|qiáo|cây cầu|座
街|jiē|con phố|条
路|lù|con đường|条 段
河|hé|dòng sông|条
地方|dìfang|nơi, chỗ|个 处
景点|jǐngdiǎn|điểm tham quan|个 处
名胜|míngshèng|danh lam thắng cảnh|处
空地|kòngdì|bãi đất trống|块 片
堤坝|dībà|con đê|道 条 座
森林|sēnlín|khu rừng|片
树叶|shùyè|lá cây|片
课|kè|bài học, tiết học|节 堂
文章|wénzhāng|bài văn|篇
小说|xiǎoshuō|tiểu thuyết|部 本 篇
信|xìn|bức thư|封
话|huà|lời nói|句 段
字|zì|chữ|个 行
诗|shī|bài thơ|首 行
歌|gē|bài hát|首 支 曲
民歌|míngē|dân ca|首 曲 支
画|huà|bức tranh|幅 张
画面|huàmiàn|khung hình|帧 幅 个
报告|bàogào|bản báo cáo|份 篇 个
报纸|bàozhǐ|tờ báo|份 张
研究|yánjiū|công trình nghiên cứu|项 个
任务|rènwu|nhiệm vụ|项 个
工作|gōngzuò|công việc|份 项 个
寓言|yùyán|truyện ngụ ngôn|则 个 篇
故事|gùshi|câu chuyện|个 则 段
新闻|xīnwén|tin tức|条 则
消息|xiāoxi|tin nhắn, tin tức|条 个 则
规定|guīdìng|quy định|条 项
节目|jiémù|chương trình|个 期 台
数据|shùjù|dữ liệu|组 项
题|tí|câu hỏi, bài tập|道 个
时间|shíjiān|thời gian|段
事情|shìqing|sự việc|件 桩 个
比赛|bǐsài|cuộc thi đấu|场 轮 局 个
奥运会|àoyùnhuì|Thế vận hội|届
考试|kǎoshì|kỳ thi|场
演出|yǎnchū|buổi biểu diễn|场 台
电话|diànhuà|cuộc gọi, điện thoại|通 个 部
钱|qián|tiền|笔 块
生意|shēngyi|việc làm ăn|笔 桩 宗
案件|ànjiàn|vụ án|起 宗 桩 个
事故|shìgù|tai nạn|起 场
病例|bìnglì|ca bệnh|例 个
棋|qí|cờ|盘 局 副
扑克|pūkè|bộ bài tây|副
风|fēng|gió|阵 股 缕
雨|yǔ|mưa|场 阵 滴
雪|xuě|tuyết|场
掌声|zhǎngshēng|tràng vỗ tay|阵
闪电|shǎndiàn|tia chớp|道
彩虹|cǎihóng|cầu vồng|道
星星|xīngxing|ngôi sao|颗
心|xīn|trái tim|颗
眼泪|yǎnlèi|nước mắt|滴
月亮|yuèliang|mặt trăng|轮 弯 个
太阳|tàiyáng|mặt trời|轮 个
明月|míngyuè|trăng sáng|轮
新月|xīnyuè|trăng non|弯
阳光|yángguāng|ánh nắng|缕 束 道 丝 片
烟|yān|khói|缕 股 丝
凉意|liángyì|hơi mát lạnh|丝 股
暖流|nuǎnliú|dòng ấm áp|股
香味|xiāngwèi|mùi thơm|股 丝 阵
清泉|qīngquán|suối trong|泓 股
湖水|húshuǐ|nước hồ|泓 片
泥|ní|bùn|滩 块
柴|chái|củi|捆 根 把
鞭炮|biānpào|tràng pháo|挂 串
`.trim().split('\n').map(line => {
  const [h, p, v, cl] = line.split('|');
  return { h, p, v, cl: cl.trim().split(/\s+/) };
});
