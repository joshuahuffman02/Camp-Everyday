import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionsService } from "./permissions.service";
import { SCOPE_KEY, ScopeDescriptor } from "./scope.decorator";

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly permissions: PermissionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const descriptor = this.reflector.getAllAndOverride<ScopeDescriptor | undefined>(SCOPE_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!descriptor) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const campgroundId = this.extractCampgroundId(request);
    const region = this.extractRegion(request);
    const isPlatform = this.permissions.isPlatformStaff(user);

    const inRegionScope = isPlatform ? true : region ? !user?.region || user.region === region : true;
    const inCampgroundScope = campgroundId
      ? isPlatform || (Array.isArray(user?.memberships) && user.memberships.some((m: any) => m.campgroundId === campgroundId))
      : true;

    if (!user || !inRegionScope || !inCampgroundScope) {
      return false;
    }

    const result = await this.permissions.checkAccess({
      user,
      campgroundId,
      region,
      resource: descriptor.resource,
      action: descriptor.action
    });

    if (!result.allowed) {
      request.permissionDenied = result;
    }

    return result.allowed;
  }

  private extractRegion(request: any): string | null {
    return (
      request.query?.region ||
      request.body?.region ||
      request.params?.region ||
      request.headers?.["x-region-id"] ||
      null
    );
  }

  private extractCampgroundId(request: any): string | null {
    return (
      request.params?.campgroundId ||
      request.query?.campgroundId ||
      request.body?.campgroundId ||
      request.headers?.["x-campground-id"] ||
      null
    );
  }
}

