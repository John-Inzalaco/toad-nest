import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { CountriesService } from './countries.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ListCountriesQueryDto,
  ListCountriesResponseDto,
} from './dto/ListCountries.dto';
import {
  GetCountryParamsDto,
  GetCountryResponseDto,
} from './dto/GetCountry.dto';
import { PermissionsService } from '../permissions/permissions.service';

@ApiBearerAuth()
@ApiTags('Countries')
@Controller('api/v1/countries')
export class CountriesController {
  constructor(
    private readonly countriesService: CountriesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get()
  async findAll(
    @Query() requestCountriesDto: ListCountriesQueryDto,
  ): Promise<ListCountriesResponseDto> {
    this.permissionsService.assertNoPermissionPolicy();
    const countries = await this.countriesService.countries(
      requestCountriesDto,
    );
    return { country: countries };
  }

  @Get('/:id')
  @ApiNotFoundResponse({ description: 'Country not found' })
  @ApiBadRequestResponse({ description: 'Invalid country id' })
  async getCountryById(
    @Param() params: GetCountryParamsDto,
  ): Promise<GetCountryResponseDto> {
    this.permissionsService.assertNoPermissionPolicy();
    const country = await this.countriesService.country({
      id: Number(params.id),
    });
    if (!country) {
      throw new NotFoundException();
    }
    return { country };
  }
}
