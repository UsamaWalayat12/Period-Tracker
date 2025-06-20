import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, BookOpen, ArrowRight, ListChecks, BrainCircuit, Heart, Film } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EducationalContentProps {
  cyclePhase: 'follicular' | 'ovulation' | 'luteal' | 'menstrual';
}

type ContentItem = {
  id: string;
  title: string;
  type: 'article' | 'video';
  description: string;
  duration: string;
  tags: string[];
  content?: string;
  videoUrl?: string;
};

export function EducationalContent({ cyclePhase }: EducationalContentProps) {
  const [selectedContentType, setSelectedContentType] = useState<'articles' | 'videos'>('articles');
  
  const getPhaseTitle = () => {
    switch (cyclePhase) {
      case 'follicular': return 'Follicular Phase';
      case 'ovulation': return 'Ovulation Phase';
      case 'luteal': return 'Luteal Phase';
      case 'menstrual': return 'Menstrual Phase';
    }
  };
  
  const getPhaseDescription = () => {
    switch (cyclePhase) {
      case 'follicular': 
        return 'In this phase, follicles in your ovaries develop and estrogen levels rise, preparing for ovulation.';
      case 'ovulation': 
        return 'Ovulation is when your ovary releases a mature egg, which can be fertilized for about 24 hours.';
      case 'luteal': 
        return 'After ovulation, the corpus luteum produces progesterone. If the egg isn\'t fertilized, hormone levels drop.';
      case 'menstrual': 
        return 'Your period begins as the uterine lining sheds. This marks the start of a new cycle.';
    }
  };
  
  const getContentForPhase = (): ContentItem[] => {
    if (selectedContentType === 'articles') {
      switch (cyclePhase) {
        case 'follicular':
          return [
            {
              id: 'f1',
              title: 'Optimizing Nutrition During Your Follicular Phase',
              type: 'article',
              description: 'Learn which foods support follicle development and hormone balance.',
              duration: '5 min read',
              tags: ['nutrition', 'hormones'],
              content: 'The follicular phase is an excellent time to focus on foods rich in antioxidants that support follicular development. Incorporate leafy greens, berries, and zinc-rich foods like pumpkin seeds into your diet.\n\nThis phase, which starts after your period ends, is characterized by rising estrogen levels as your body prepares to release an egg. Your energy levels often increase during this time, making it ideal for more intense physical activity.\n\nFoods that support estrogen metabolism include cruciferous vegetables like broccoli, cabbage, and cauliflower. Adding these to your meals can help maintain optimal hormone levels.'
            },
            {
              id: 'f2',
              title: 'Exercise Strategies for the Follicular Phase',
              type: 'article',
              description: 'How to sync your workouts with your hormonal changes for optimal results.',
              duration: '7 min read',
              tags: ['fitness', 'hormones'],
              content: 'The follicular phase is often when women experience their highest energy levels, making it an ideal time for more challenging workouts.\n\nAs estrogen rises, you may notice improved strength and endurance. This is a great time for high-intensity interval training (HIIT), strength training, or trying new fitness classes.\n\nResearch suggests that training during this phase may lead to greater strength gains compared to other phases of your cycle. Consider scheduling your most demanding workouts during this time.'
            },
            {
              id: 'f3',
              title: 'Understanding Cervical Fluid Changes',
              type: 'article',
              description: 'Why cervical fluid changes throughout your cycle and what it means.',
              duration: '4 min read',
              tags: ['fertility', 'tracking'],
              content: 'During the follicular phase, especially as you approach ovulation, you\'ll notice changes in your cervical fluid. These changes are important fertility signs.\n\nAs estrogen rises, cervical fluid typically becomes increasingly wet, clear, and stretchy - often compared to egg whites. This type of fluid creates a favorable environment for sperm, helping them survive longer and swim more effectively.\n\nTracking these changes can help identify your fertile window, whether you\'re trying to conceive or practice natural birth control methods.'
            }
          ];
        case 'ovulation':
          return [
            {
              id: 'o1',
              title: 'Signs of Ovulation You Shouldn\'t Ignore',
              type: 'article',
              description: 'How to identify when you\'re ovulating through physical and emotional signs.',
              duration: '6 min read',
              tags: ['fertility', 'tracking'],
              content: 'Recognizing the signs of ovulation is crucial for understanding your fertility. Common physical signs include a slight increase in basal body temperature, changes in cervical fluid to a clear, stretchy consistency, and mild pelvic pain on one side (mittelschmerz).\n\nMany women also experience increased libido, heightened senses (particularly smell), and changes in energy levels during ovulation. Some may notice breast tenderness or mild spotting.\n\nThese signs can vary significantly between individuals, so tracking multiple indicators over several cycles helps identify your personal patterns.'
            },
            {
              id: 'o2',
              title: 'The Science Behind Ovulation Tests',
              type: 'article',
              description: 'How ovulation prediction kits work and how to interpret the results accurately.',
              duration: '5 min read',
              tags: ['fertility', 'tracking'],
              content: 'Ovulation prediction kits detect luteinizing hormone (LH) in your urine, which surges 24-36 hours before ovulation. Understanding how these tests work can improve their effectiveness.\n\nThe test line needs to be as dark as or darker than the control line to indicate a positive result. For most accurate results, test at the same time each day, ideally between 2-8pm when LH is most concentrated in urine.\n\nWhile these tests can predict ovulation, they don\'t confirm that ovulation has occurred. Combining them with other tracking methods like basal body temperature provides more complete information about your cycle.'
            },
            {
              id: 'o3',
              title: 'Optimizing Fertility During Your Ovulation Window',
              type: 'article',
              description: 'Practical tips for couples trying to conceive during the fertile window.',
              duration: '8 min read',
              tags: ['fertility', 'conception'],
              content: 'The fertile window typically includes the 5 days before ovulation and the day of ovulation itself. Understanding this timing is crucial when trying to conceive.\n\nSperm can survive in the female reproductive tract for up to 5 days, while an egg is viable for about 24 hours after ovulation. This creates approximately a 6-day window when pregnancy is possible each cycle.\n\nTiming intercourse every 1-2 days during this window maximizes chances of conception. Research suggests that waiting longer between ejaculations may decrease sperm quality, so regular intercourse during the fertile window is recommended over timing a single encounter.'
            }
          ];
        case 'luteal':
          return [
            {
              id: 'l1',
              title: 'Managing PMS Symptoms Naturally',
              type: 'article',
              description: 'Evidence-based approaches to reduce premenstrual symptoms without medication.',
              duration: '7 min read',
              tags: ['PMS', 'wellness'],
              content: 'Premenstrual syndrome (PMS) affects many women during the luteal phase. Several evidence-based strategies can help manage symptoms naturally.\n\nRegular physical activity, particularly aerobic exercise, can reduce bloating and improve mood. Specific nutrients like calcium (1200mg daily), vitamin B6 (50-100mg daily), and magnesium (200-360mg daily) have shown effectiveness in clinical studies.\n\nStress management techniques including mindfulness meditation, yoga, and cognitive behavioral therapy can significantly reduce PMS symptoms. Limiting caffeine, alcohol, and foods high in salt and sugar may also provide relief from physical symptoms.'
            },
            {
              id: 'l2',
              title: 'The Luteal Phase and Your Sleep Quality',
              type: 'article',
              description: 'Why sleep often changes before your period and how to improve it.',
              duration: '5 min read',
              tags: ['sleep', 'hormones'],
              content: 'Many women experience sleep disturbances during the luteal phase due to hormonal fluctuations. Understanding these changes can help you improve sleep quality.\n\nProgesterone, which rises during the luteal phase, can have a sedative effect initially, but as it drops alongside estrogen before menstruation, sleep quality often declines. Body temperature increases during this phase can also disrupt sleep.\n\nEstablishing a consistent sleep schedule, keeping your bedroom cool (65-68°F/18-20°C), avoiding caffeine after noon, and practicing relaxation techniques before bed can significantly improve sleep during this challenging phase.'
            },
            {
              id: 'l3',
              title: 'Emotional Changes in the Luteal Phase',
              type: 'article',
              description: 'The science behind mood swings and how to support emotional wellbeing.',
              duration: '6 min read',
              tags: ['mental health', 'hormones'],
              content: 'The luteal phase often brings emotional changes as hormones fluctuate. Understanding the biological basis can help manage these shifts.\n\nEstrogen and progesterone affect neurotransmitters like serotonin and GABA, which influence mood regulation. As these hormones decline in the late luteal phase, many women experience irritability, anxiety, or mood swings.\n\nSelf-care strategies that can help include regular exercise (which boosts endorphins), adequate sleep, stress management techniques, and social support. If emotional symptoms significantly impact your daily life, consider tracking their severity and discussing patterns with a healthcare provider, as they could indicate PMDD (Premenstrual Dysphoric Disorder).'
            }
          ];
        case 'menstrual':
          return [
            {
              id: 'm1',
              title: 'Understanding Your Period Flow and What It Means',
              type: 'article',
              description: 'What your menstrual flow reveals about your reproductive health.',
              duration: '5 min read',
              tags: ['periods', 'health'],
              content: 'Your menstrual flow can provide valuable information about your health. A typical period lasts 3-7 days with an average blood loss of 30-80ml throughout.\n\nChanges in flow volume, duration, or consistency may indicate hormonal imbalances, structural abnormalities, or other health conditions. Consistently heavy periods (soaking through products every 1-2 hours) warrant medical attention as they may indicate conditions like fibroids or adenomyosis.\n\nTracking your flow pattern over several cycles helps establish your normal baseline. This information is valuable both for monitoring your own health and for communicating effectively with healthcare providers.'
            },
            {
              id: 'm2',
              title: 'Nutrition Needs During Menstruation',
              type: 'article',
              description: 'Foods to eat and avoid during your period to feel your best.',
              duration: '6 min read',
              tags: ['nutrition', 'periods'],
              content: 'During menstruation, specific nutritional strategies can help manage symptoms and replace lost nutrients. Iron-rich foods are particularly important to replenish what\'s lost through bleeding.\n\nIncorporate iron sources like lean red meat, lentils, spinach, and fortified cereals, ideally paired with vitamin C to enhance absorption. Maintaining adequate hydration helps reduce bloating and cramping.\n\nFoods that may worsen period symptoms include those high in salt (increasing water retention), caffeine (potentially increasing breast tenderness and anxiety), and highly processed foods (which can promote inflammation). Focus instead on anti-inflammatory foods like fatty fish, berries, and turmeric.'
            },
            {
              id: 'm3',
              title: 'Exercise During Your Period: What\'s Best?',
              type: 'article',
              description: 'How to adjust your workout routine during menstruation for maximum benefit.',
              duration: '5 min read',
              tags: ['fitness', 'periods'],
              content: 'Contrary to some misconceptions, exercise during your period is not only safe but can be beneficial for managing symptoms like cramps and mood changes.\n\nLight to moderate exercise stimulates blood flow and releases endorphins, which can act as natural pain relievers. Activities like walking, swimming, cycling, and yoga are particularly effective during this time.\n\nIt\'s normal to experience reduced energy and performance during your period. Listen to your body and adjust intensity accordingly—this might mean choosing a restorative yoga class over HIIT, or shortening your usual workout. Staying active, even with modified exercise, supports overall cycle health.'
            }
          ];
      }
    } else { // videos
      switch (cyclePhase) {
        case 'follicular':
          return [
            {
              id: 'fv1',
              title: 'Understanding Your Follicular Phase',
              type: 'video',
              description: 'Comprehensive overview of hormonal changes and body processes.',
              duration: '4 min video',
              tags: ['hormones', 'education'],
              videoUrl: 'https://www.youtube.com/embed/yiXGyIeV8G0'
            },
            {
              id: 'fv2',
              title: 'Nutrition for Hormonal Balance',
              type: 'video',
              description: 'Foods that support estrogen production and follicle development.',
              duration: '12 min video',
              tags: ['nutrition', 'wellness'],
              videoUrl: 'https://www.youtube.com/embed/h36poEtEbi4'
            }
          ];
        case 'ovulation':
          return [
            {
              id: 'ov1',
              title: 'Signs of Ovulation You Can Observe',
              type: 'video',
              description: 'Physical signs that indicate you\'re approaching or experiencing ovulation.',
              duration: '7 min',
              tags: ['fertility', 'tracking'],
              videoUrl: 'https://example.com/videos/ovulation-signs'
            },
            {
              id: 'ov2',
              title: 'The Fertility Window Explained',
              type: 'video',
              description: 'Scientific explanation of when conception is possible.',
              duration: '10 min',
              tags: ['fertility', 'education'],
              videoUrl: 'https://example.com/videos/fertility-window'
            }
          ];
        case 'luteal':
          return [
            {
              id: 'lv1',
              title: 'Managing PMS Naturally',
              type: 'video',
              description: 'Evidence-based approaches to reduce premenstrual symptoms.',
              duration: '15 min',
              tags: ['PMS', 'wellness'],
              videoUrl: 'https://example.com/videos/natural-pms-management'
            },
            {
              id: 'lv2',
              title: 'Hormone Changes After Ovulation',
              type: 'video',
              description: 'How progesterone affects your body and mind.',
              duration: '9 min',
              tags: ['hormones', 'education'],
              videoUrl: 'https://example.com/videos/luteal-hormones'
            }
          ];
        case 'menstrual':
          return [
            {
              id: 'mv1',
              title: 'Period Pain: Causes and Solutions',
              type: 'video',
              description: 'Understanding cramps and effective relief strategies.',
              duration: '11 min',
              tags: ['periods', 'pain management'],
              videoUrl: 'https://example.com/videos/period-pain'
            },
            {
              id: 'mv2',
              title: 'Exercise During Your Period',
              type: 'video',
              description: 'Which workouts are most beneficial during menstruation.',
              duration: '8 min',
              tags: ['fitness', 'periods'],
              videoUrl: 'https://example.com/videos/period-exercise'
            }
          ];
      }
    }
    return [];
  };
  
  const contentItems = getContentForPhase();
  
  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/20">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">{getPhaseTitle()}</h3>
            <p className="text-sm text-muted-foreground">{getPhaseDescription()}</p>
          </div>
        </div>
      </GlassCard>
      
      <div className="flex gap-2 mb-4">
        <Button 
          variant={selectedContentType === 'articles' ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedContentType('articles')}
          className="flex gap-2 items-center"
        >
          <BookOpen className="h-4 w-4" />
          <span>Articles</span>
        </Button>
        <Button 
          variant={selectedContentType === 'videos' ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedContentType('videos')}
          className="flex gap-2 items-center"
        >
          <Video className="h-4 w-4" />
          <span>Videos</span>
        </Button>
      </div>
      
      {contentItems.length > 0 ? (
        <div className="space-y-3">
          {contentItems.map(item => (
            <Dialog key={item.id}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <div className="flex items-center gap-1 text-xs bg-primary/10 px-2 py-1 rounded-full text-primary">
                        {item.type === 'article' ? <BookOpen className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                        <span>{item.duration}</span>
                      </div>
                    </div>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0 flex justify-between items-center">
                    <div className="flex gap-1">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </CardFooter>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>{item.title}</DialogTitle>
                  <DialogDescription>
                    {item.type === 'article' ? item.duration + ' read' : item.duration + ' video'}
                  </DialogDescription>
                </DialogHeader>
                
                {item.type === 'article' && item.content && (
                  <div className="mt-4 space-y-4">
                    {item.content.split('\n\n').map((paragraph, i) => (
                      <p key={i} className="text-sm leading-relaxed">{paragraph}</p>
                    ))}
                  </div>
                )}
                
                {item.type === 'video' && (
                  <div className="mt-4">
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src={item.videoUrl}
                        title={item.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                )}
                
                <div className="flex justify-between mt-6">
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button size="sm">
                    <ListChecks className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No content available for this phase.</p>
        </Card>
      )}
    </div>
  );
}
