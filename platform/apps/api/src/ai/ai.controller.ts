import { Body, Controller, Post, Query, UseGuards } from "@nestjs/common";
import { AiService } from "./ai.service";
import { GenerateAiSuggestionsDto } from "./dto/generate-ai-suggestions.dto";
import { UpdateAiSettingsDto } from "./dto/update-ai-settings.dto";
import { JwtAuthGuard, Roles, RolesGuard } from "../auth/guards";
import { UserRole } from "@prisma/client";
import { AskDto } from "./dto/ask.dto";
import { RecommendDto } from "./dto/recommend.dto";
import { PricingSuggestDto } from "./dto/pricing-suggest.dto";
import { SemanticSearchDto } from "./dto/semantic-search.dto";
import { CopilotActionDto } from "./dto/copilot-action.dto";

@Controller("ai")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Roles(UserRole.owner, UserRole.manager)
  @Post("settings")
  async updateSettings(@Body() dto: UpdateAiSettingsDto & { campgroundId: string }) {
    return this.ai.updateSettings(dto.campgroundId, dto);
  }

  @Roles(UserRole.owner, UserRole.manager, UserRole.marketing)
  @Post("suggestions")
  async generate(@Body() dto: GenerateAiSuggestionsDto) {
    return this.ai.generate(dto);
  }

  @Roles(UserRole.owner, UserRole.manager, UserRole.marketing, UserRole.front_desk, UserRole.finance)
  @Post("ask")
  async ask(@Body() dto: AskDto) {
    return this.ai.ask(dto);
  }

  @Roles(UserRole.owner, UserRole.manager, UserRole.marketing, UserRole.front_desk, UserRole.finance)
  @Post("recommendations")
  async recommendations(@Body() dto: RecommendDto, @Query("mock") mock?: string) {
    return this.ai.recommend(dto, mock === "true" || mock === "1");
  }

  @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
  @Post("pricing-suggestions")
  async pricing(@Body() dto: PricingSuggestDto, @Query("mock") mock?: string) {
    return this.ai.pricingSuggest(dto, mock === "true" || mock === "1");
  }

  @Roles(UserRole.owner, UserRole.manager, UserRole.front_desk, UserRole.marketing)
  @Post("semantic-search")
  async semanticSearch(@Body() dto: SemanticSearchDto, @Query("mock") mock?: string) {
    return this.ai.semanticSearch(dto, mock === "true" || mock === "1");
  }

  @Roles(UserRole.owner, UserRole.manager, UserRole.front_desk, UserRole.finance, UserRole.marketing)
  @Post("copilot")
  async copilot(@Body() dto: CopilotActionDto, @Query("mock") mock?: string) {
    return this.ai.copilot(dto, mock === "true" || mock === "1");
  }
}

