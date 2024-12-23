import { Controller, Post, UseFilters, Headers } from '@nestjs/common';
import { HttpExceptionFilter } from '../core/http-exception.filter';
import { SuggestionsService } from './suggestions.service';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

@Controller('suggestion')
@UseFilters(HttpExceptionFilter)
export class SuggestionsController {
  private readonly logger = new CustomLogger(SuggestionsController.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private suggestionsService: SuggestionsService,
  ) {}

  @Post('/store/favorites')
  async runSPLCron(@Headers('userId') userId) {
    const favoritesMap = await this.suggestionsService.updateFavorites(userId);
    await this.suggestionsService.setSuggestions(favoritesMap, userId);
    return true;
  }
}
